import assert from 'node:assert/strict'
import test from 'node:test'
import { findOwnedJob } from './ownedJob.js'

test('loads a rejected job from a later page of the employer’s own jobs', async () => {
  const rejected = { id: 101, status: 'rejected' }
  const list = async ({ page, page_size }) => ({
    total: page_size + 1,
    items: page === 1 ? [{ id: 42 }] : [rejected],
  })
  assert.equal(await findOwnedJob(list, '101'), rejected)
})

test('rejects a job outside the employer’s own list', async () => {
  const list = async () => ({ total: 1, items: [{ id: 42 }] })
  await assert.rejects(findOwnedJob(list, '43'), /không có quyền/)
})
