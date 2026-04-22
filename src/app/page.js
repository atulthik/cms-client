import CmsDashboard from "./cms-dashboard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api/posts";

async function getInitialPosts() {
  try {
    const response = await fetch(API_BASE, { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      return { posts: [], error: payload.error || "Unable to load posts" };
    }

    return { posts: payload.data || [], error: "" };
  } catch (error) {
    return { posts: [], error: error.message || "Unable to load posts" };
  }
}

export default async function Home() {
  const { posts, error } = await getInitialPosts();

  return <CmsDashboard initialPosts={posts} initialError={error} />;
}
