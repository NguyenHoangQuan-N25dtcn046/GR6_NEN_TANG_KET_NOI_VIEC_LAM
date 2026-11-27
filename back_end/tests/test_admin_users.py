import pytest

from app.models.entities import User
from app.core.security import hash_password


@pytest.mark.parametrize('role', ['candidate', 'employer', 'other'])
def test_user_management_requires_admin(api, role):
    client, _, tokens = api
    assert client.get('/api/v1/admin/users', headers=tokens[role]).status_code == 403
    assert client.patch('/api/v1/admin/users/1/status', headers=tokens[role], json={'is_active': False}).status_code == 403


def test_anonymous_cannot_manage_users(api):
    client, _, _ = api
    assert client.get('/api/v1/admin/users').status_code == 401
    assert client.patch('/api/v1/admin/users/1/status', json={'is_active': False}).status_code == 401


def test_list_filters_pagination_and_safe_fields(api):
    client, _, tokens = api
    headers = tokens['admin']
    path = '/api/v1/admin/users'
    response = client.get(path, headers=headers, params={'limit': 2})
    assert response.status_code == 200
    data = response.json()
    assert data['total'] == 4 and len(data['items']) == 2
    assert set(data['items'][0]) == {'id', 'email', 'role', 'is_active', 'created_at'}
    second = client.get(path, headers=headers, params={'offset': 2, 'limit': 2}).json()
    assert not ({x['id'] for x in data['items']} & {x['id'] for x in second['items']})
    match = client.get(path, headers=headers, params={'q': 'CANDIDATE', 'role': 'candidate', 'is_active': True}).json()
    assert match['total'] == 1 and match['items'][0]['id'] == 1
    assert client.get(path, headers=headers, params={'q': '%'}).json()['total'] == 0
    assert client.get(path, headers=headers, params={'limit': 101}).status_code == 422
    assert client.get(path, headers=headers, params={'role': 'invalid'}).status_code == 422


@pytest.mark.parametrize('target,role', [(1, 'candidate'), (2, 'employer')])
def test_lock_unlock_and_access(api, target, role):
    client, sessions, tokens = api
    headers = tokens['admin']
    path = f'/api/v1/admin/users/{target}/status'
    # Use a domain accepted by EmailStr, even in environments rejecting test TLDs.
    with sessions() as db:
        user = db.get(User, target)
        user.email = role + '@example.com'
        user.password_hash = hash_password('SecurePass123!')
        db.commit()
    credentials = {'email': role + '@example.com', 'password': 'SecurePass123!'}
    assert client.post('/api/v1/auth/login', json=credentials).status_code == 200
    response = client.patch(path, headers=headers, json={'is_active': False})
    assert response.status_code == 200 and response.json()['is_active'] is False
    assert client.get('/api/v1/auth/me', headers=tokens[role]).status_code == 403
    assert client.post('/api/v1/auth/login', json=credentials).status_code == 403
    assert client.get('/api/v1/admin/users', headers=headers, params={'is_active': False}).json()['total'] == 1
    assert client.patch(path, headers=headers, json={'is_active': False}).status_code == 200
    assert client.patch(path, headers=headers, json={'is_active': True}).json()['is_active'] is True
    assert client.post('/api/v1/auth/login', json=credentials).status_code == 200
    with sessions() as db:
        assert db.get(User, target).is_active is True


def test_protect_admin_and_validate_patch(api):
    client, sessions, tokens = api
    headers = tokens['admin']
    with sessions() as db:
        db.add(User(id=5, email='admin2@example.com', password_hash='unused', role='admin'))
        db.commit()
    for target in (4, 5):
        assert client.patch(f'/api/v1/admin/users/{target}/status', headers=headers, json={'is_active': False}).status_code == 403
    assert client.patch('/api/v1/admin/users/999/status', headers=headers, json={'is_active': False}).status_code == 404
    for body in ({}, {'is_active': 'false'}, {'is_active': False, 'role': 'admin'}):
        assert client.patch('/api/v1/admin/users/1/status', headers=headers, json=body).status_code == 422
