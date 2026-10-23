import dynamic from "next/dynamic";

const JobsModeration = dynamic(
  () => import("@/components/Jobs/JobsModerationContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading Job Postings...
      </div>
    ),
  }
);

const JobsPage = () => {
  return <JobsModeration />;
};

export default JobsPage;
