import dynamic from "next/dynamic";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), {
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#f6f8f6] dark:bg-[#102216]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2bee6c] border-t-transparent" />
    </div>
  ),
});

export default function Home() {
  return <HomeMap />;
}
