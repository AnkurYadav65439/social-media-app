import Loader from "@/components/shared/Loader";
import UserCard from "@/components/shared/UserCard";
import { useToast } from "@/components/ui/use-toast";
import { useGetUsers } from "@/lib/react-query/queriesAndMutations";
// import { Models } from "appwrite";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const AllUsers = () => {
  const { toast } = useToast();
  const { ref, inView } = useInView();
  const { data: creators, isLoading, isError: isErrorCreators, hasNextPage, fetchNextPage } = useGetUsers();

  useEffect(() => {
    if (inView) fetchNextPage();
  }, [inView])

  if (isErrorCreators) {
    toast({ title: "Something went wrong." });

    return;
  }

  return (
    <div className="common-container md:ml-[270px]">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>
        {isLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="user-grid">
            {creators?.pages.map((page) => (
              page?.documents.map((doc) => (
                <li key={doc.$id} className="flex-1 min-w-[200px] w-full ">
                  <UserCard user={doc} />
                </li>
              ))
            ))}
          </ul>
          // <ul className="user-grid">
          //   {creators?.documents.map((creator: Models.Document) => (
          //     <li key={creator?.$id} className="flex-1 min-w-[200px] w-full ">
          //       <UserCard user={creator}/>
          //     </li>
          //   ))}
          // </ul>
        )}
      </div>

      {hasNextPage && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}

    </div>
  );
};

export default AllUsers;