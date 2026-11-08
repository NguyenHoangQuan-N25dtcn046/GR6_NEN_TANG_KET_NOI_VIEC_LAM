import { useEffect, useState } from 'react'
import { jobsApi } from '../api/client.js'
import CanvasBackground from '../components/CanvasBackground.jsx'
import JobCard from '../components/JobCard.jsx'
import { Spinner, inputCls } from '../components/ui.jsx'
import { CATEGORIES, PROVINCES } from '../constants.js'

const WORK_TYPES = ['onsite', 'remote', 'hybrid']

export default function Home() {
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    category: '',
    work_type: '',
    salary_min: '',
    salary_max: '',
  })
  const [applied, setApplied] = useState({})
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await jobsApi.list({ ...applied, page, page_size: 9 })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied])

  const setFilter = (key, value) => setFilters({ ...filters, [key]: value })

  const handleSearch = (e) => {
    e.preventDefault()
    setApplied({ ...filters })
  }

  const handleReset = () => {
    const empty = {
      keyword: '',
      location: '',
      category: '',
      work_type: '',
      salary_min: '',
      salary_max: '',
    }
    setFilters(empty)
    setApplied(empty)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <CanvasBackground />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:py-20">
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Tìm công việc{' '}
            <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
              phù hợp với bạn
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Hàng trăm cơ hội nghề nghiệp từ các công ty hàng đầu đang chờ đón bạn.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:flex-row"
          >
            <input
              className={`flex-1 border-0 shadow-none focus:ring-0 ${inputCls}`}
              placeholder="Từ khóa: vị trí, kỹ năng…"
              value={filters.keyword}
              onChange={(e) => setFilter('keyword', e.target.value)}
            />
            <input
              className={`flex-1 border-0 shadow-none focus:ring-0 ${inputCls}`}
              placeholder="Địa điểm"
              value={filters.location}
              onChange={(e) => setFilter('location', e.target.value)}
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Bộ lọc</h2>
              <button onClick={handleReset} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Đặt lại
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ngành nghề</label>
                <select
                  className={inputCls}
                  value={filters.category}
                  onChange={(e) => setFilter('category', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tỉnh/Thành</label>
                <select
                  className={inputCls}
                  value={filters.location}
                  onChange={(e) => setFilter('location', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hình thức</label>
                <div className="space-y-1.5">
                  {WORK_TYPES.map((w) => (
                    <label key={w} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name="work_type"
                        className="h-4 w-4 accent-brand-600"
                        checked={filters.work_type === w}
                        onChange={() => setFilter('work_type', w)}
                      />
                      <span className="capitalize">{w}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Lương tối thiểu</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="VNĐ"
                    value={filters.salary_min}
                    onChange={(e) => setFilter('salary_min', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tối đa</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="VNĐ"
                    value={filters.salary_max}
                    onChange={(e) => setFilter('salary_max', e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Áp dụng
              </button>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Tìm thấy <span className="font-semibold text-slate-900">{data.total}</span> việc làm
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 text-brand-600">
                <Spinner className="h-8 w-8" />
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 p-6 text-center text-rose-600">{error}</div>
            ) : data.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-400">
                Không có việc làm nào phù hợp với bộ lọc.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Pagination data={data} onPage={load} />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function Pagination({ data, onPage }) {
  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size))
  if (totalPages <= 1) return null
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
            p === data.page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
