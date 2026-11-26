import { api } from './api.js';

const dates = [
  ['start_date', 'Ngày bắt đầu', 'date', true],
  ['end_date', 'Ngày kết thúc', 'date', false],
];

const sections = [
  {
    id: 'work-history',
    endpoint: '/candidate/experiences',
    label: 'kinh nghiệm',
    fields: [
      ['company', 'Công ty', 'text', true, 200],
      ['position', 'Vị trí', 'text', true, 200],
      ...dates,
      ['description', 'Mô tả', 'textarea', false, 10000],
    ],
    title: record => record.position,
    subtitle: record => record.company,
  },
  {
    id: 'education-history',
    endpoint: '/candidate/educations',
    label: 'học vấn',
    fields: [
      ['school', 'Trường', 'text', true, 200],
      ['major', 'Chuyên ngành', 'text', true, 200],
      ['degree', 'Bằng cấp', 'text', true, 100],
      ...dates,
    ],
    title: record => record.school,
    subtitle: record => [record.degree, record.major].join(' · '),
  },
];

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function button(label, action, className = 'btn btn--outline') {
  const element = node('button', label, className);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}

function mountSection(config) {
  const section = document.getElementById(config.id);
  const list = section.querySelector('.record-list');
  const status = section.querySelector('[role="status"]');
  const editor = node('form', '', 'profile-form');
  const fields = node('fieldset', '', 'profile-form-grid record-fields');
  const actions = node('div', '', 'profile-form-actions');
  const submit = node('button', 'Lưu', 'btn');
  submit.type = 'submit';
  const add = button('Thêm ' + config.label, () => openEditor());
  const cancel = button('Hủy', closeEditor);
  for (const [name, label, type, required, maxLength] of config.fields) {
    const wrapper = node('label', label, 'profile-field');
    const control = node(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') control.type = type;
    if (maxLength) control.maxLength = maxLength;
    control.name = name;
    control.required = required;
    wrapper.append(control);
    fields.append(wrapper);
  }
  actions.append(cancel, submit);
  fields.append(actions);
  editor.append(fields);
  editor.hidden = true;
  section.querySelector('.profile-card-header').append(add);
  section.append(editor);
  let records = [];
  let editing = null;
  let busy = false;

  function openEditor(record = null) {
    if (busy) return;
    editing = record;
    status.textContent = '';
    for (const [name] of config.fields) editor.elements.namedItem(name).value = record?.[name] ?? '';
    editor.hidden = false;
    editor.querySelector('input').focus();
  }
  function closeEditor() {
    editor.hidden = true;
    editing = null;
  }
  function setBusy(value) {
    busy = value;
    fields.disabled = value;
    add.disabled = value;
    for (const control of list.querySelectorAll('button')) control.disabled = value;
  }
  function render() {
    const cards = records.map(record => {
      const item = node('li', '', 'profile-record');
      const tools = node('div', '', 'profile-form-actions');
      tools.append(
        button('Sửa', () => openEditor(record)),
        button('Xóa', () => {
          if (window.confirm('Xóa mục ' + config.title(record) + '?')) {
            run(async () => {
              await api(config.endpoint + '/' + record.id, { method: 'DELETE', auth: true });
              records = records.filter(entry => entry.id !== record.id);
              if (editing?.id === record.id) closeEditor();
              render();
              status.textContent = 'Đã xóa mục ' + config.label + '.';
            });
          }
        }),
      );
      item.append(
        node('h3', config.title(record)),
        node('p', config.subtitle(record)),
        node('p', record.start_date + ' – ' + (record.end_date ?? 'Hiện tại')),
      );
      if (record.description) item.append(node('p', record.description));
      item.append(tools);
      return item;
    });
    list.replaceChildren(...(cards.length ? cards : [node('li', 'Chưa có thông tin ' + config.label + '.')]));
  }
  async function run(action) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }
  editor.addEventListener('submit', event => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(editor));
    for (const [name, label, , required] of config.fields) {
      const value = body[name].trim();
      if (required && !value) {
        status.textContent = 'Vui lòng nhập ' + label.toLowerCase() + '.';
        return;
      }
      body[name] = value || null;
    }
    if (body.end_date && body.end_date < body.start_date) {
      status.textContent = 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
      return;
    }
    run(async () => {
      const path = editing ? config.endpoint + '/' + editing.id : config.endpoint;
      const saved = await api(path, { method: editing ? 'PATCH' : 'POST', body, auth: true });
      records = [saved, ...records.filter(entry => entry.id !== saved.id)]
        .sort((a, b) => b.start_date.localeCompare(a.start_date) || b.id - a.id);
      closeEditor();
      render();
      status.textContent = 'Đã lưu mục ' + config.label + '.';
    });
  });
  return run(async () => {
    records = await api(config.endpoint, { auth: true });
    render();
  });
}

export function loadProfileRecords() {
  return Promise.all(sections.map(mountSection));
}
