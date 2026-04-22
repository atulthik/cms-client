"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api/posts";

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  author: "Admin",
  status: "draft",
  featuredImage: "",
  tags: "",
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toForm(post) {
  return {
    title: post.title ?? "",
    slug: post.slug ?? "",
    content: post.content ?? "",
    excerpt: post.excerpt ?? "",
    author: post.author ?? "Admin",
    status: post.status ?? "draft",
    featuredImage: post.featuredImage ?? "",
    tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
  };
}

function postPayload(form) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    content: form.content.trim(),
    excerpt: form.excerpt.trim(),
    author: form.author.trim() || "Admin",
    status: form.status,
    featuredImage: form.featuredImage.trim(),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
        isPublished
          ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30"
          : "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30"
      }`}
    >
      {status}
    </span>
  );
}

export default function CmsDashboard({ initialPosts = [], initialError = "" }) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(initialError);
  const [activeId, setActiveId] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load posts");
      }

      setPosts(payload.data || []);
    } catch (err) {
      setError(err.message || "Unable to load posts");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === "published").length;
    const drafts = posts.filter((post) => post.status !== "published").length;
    const tags = new Set(posts.flatMap((post) => post.tags || [])).size;
    return { total: posts.length, published, drafts, tags };
  }, [posts]);

  function resetForm() {
    setForm(emptyForm);
    setActiveId(null);
    setSlugTouched(false);
  }

  function handleEdit(post) {
    setActiveId(post._id);
    setSlugTouched(true);
    setForm(toForm(post));
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "title" && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });

    if (name === "slug") {
      setSlugTouched(true);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = postPayload(form);

    try {
      const response = await fetch(
        activeId ? `${API_BASE}/${activeId}` : API_BASE,
        {
          method: activeId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save post");
      }

      await loadPosts();
      resetForm();
    } catch (err) {
      setError(err.message || "Unable to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete post");
      }

      await loadPosts();
      if (activeId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Unable to delete post");
    } finally {
      setSaving(false);
    }
  }

  const selectedPost = activeId ? posts.find((post) => post._id === activeId) : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#07111f_0%,#0a1220_45%,#f5f7fb_45%,#f5f7fb_100%)] text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                CMS Frontend
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                A focused content dashboard for your posts API.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200/85 sm:text-lg">
                Manage articles, drafts, and publishing metadata from one screen.
                The frontend connects directly to{" "}
                <span className="rounded-full bg-white/10 px-2 py-1 font-mono text-sm text-cyan-100">
                  {API_BASE}
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="text-slate-300">Total posts</div>
                <div className="mt-1 text-3xl font-black">{stats.total}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="text-slate-300">Published</div>
                <div className="mt-1 text-3xl font-black">{stats.published}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="text-slate-300">Drafts</div>
                <div className="mt-1 text-3xl font-black">{stats.drafts}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="text-slate-300">Tags</div>
                <div className="mt-1 text-3xl font-black">{stats.tags}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Content library</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recent posts pulled from your backend.
                </p>
              </div>
              <button
                type="button"
                onClick={loadPosts}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                  Loading posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                  No posts yet. Create the first article using the form on the
                  right.
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post._id}
                    className={`overflow-hidden rounded-3xl border p-4 transition ${
                      activeId === post._id
                        ? "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-100"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-36 w-full rounded-2xl object-cover md:h-28 md:w-36"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-slate-200 md:h-28 md:w-36">
                          No image
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={post.status} />
                          <span className="text-sm text-slate-500">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-slate-900">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {post.excerpt || post.content}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(post.tags || []).map((tag) => (
                            <span
                              key={`${post._id}-${tag}`}
                              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm text-slate-500">
                            By <span className="font-medium text-slate-700">{post.author}</span>{" "}
                            | slug{" "}
                            <span className="font-mono text-slate-700">{post.slug}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(post)}
                              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(post._id)}
                              className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {activeId ? "Edit post" : "Create post"}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedPost
                    ? `Editing ${selectedPost.title}`
                    : "Fill in the fields to add a new article."}
                </p>
              </div>
              {activeId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Title</span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Build a better CMS"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-400"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Slug</span>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="build-a-better-cms"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Author</span>
                  <input
                    name="author"
                    value={form.author}
                    onChange={handleChange}
                    placeholder="Admin"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Featured image URL</span>
                <input
                  name="featuredImage"
                  value={form.featuredImage}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Excerpt</span>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Short summary shown in the content library."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Content</span>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Write the full article body here."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Tags
                </span>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="cms, nextjs, backend"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                />
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : activeId ? "Update post" : "Publish post"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
