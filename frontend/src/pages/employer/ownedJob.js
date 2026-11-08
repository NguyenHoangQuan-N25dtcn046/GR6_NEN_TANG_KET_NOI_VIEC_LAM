export async function findOwnedJob(list, id, cancelled = () => false) {
  const page_size = 100
  for (let page = 1; !cancelled(); page += 1) {
    const { items, total } = await list({ page, page_size })
    const job = items.find(item => String(item.id) === id)
    if (job) return job
    if (page * page_size >= total) break
  }
  throw new Error('Tin tuyển dụng không tồn tại hoặc bạn không có quyền chỉnh sửa.')
}
