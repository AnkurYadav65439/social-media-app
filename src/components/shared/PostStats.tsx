import { useDeleteSavedPost, useGetCurrentUser, useLikePost, useSavePost } from "@/lib/react-query/queriesAndMutations";
import { checkIsLiked } from "@/lib/utils";
import { Models } from "appwrite"
import React, { useEffect, useState } from "react";
import Loader from "./Loader";

type postStatsProps = {
    post?: Models.Document;
    userId: string;
}

const PostStats = ({ post, userId }: postStatsProps) => {
    const likesList = post?.likes.map((user: Models.Document) => user.$id);
    const [likes, setLikes] = useState(likesList);
    const [isSaved, setIsSaved] = useState(false);

    const { mutate: likePost } = useLikePost();
    const { mutate: savePost, isPending: isSavingPost } = useSavePost();
    const { mutate: deleteSavedPost, isPending: isDeletingSaved } = useDeleteSavedPost();
    const { data: currentUser } = useGetCurrentUser();

    const savedPostRecord = currentUser?.save.find((record: Models.Document) => record.post.$id === post?.$id);

    useEffect(() => {
        setIsSaved(!!savedPostRecord)
    }, [currentUser]);

    const handleLikePost = (e: React.MouseEvent) => {
        //so while clicking on this, can't able to click on any other clickable 
        e.stopPropagation();

        let newLikes = [...likes];

        const hasLiked = newLikes.includes(userId);

        if (hasLiked) {
            newLikes = newLikes.filter((likeUser: string) => likeUser !== userId)
        } else {
            newLikes.push(userId);
        }

        setLikes(newLikes);
        likePost({ postId: post?.$id || '', likesArray: newLikes })
    }

    const handleSavePost = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (savedPostRecord) {
            setIsSaved(false);
            deleteSavedPost(savedPostRecord.$id);
        } else {
            savePost({ postId: post?.$id || '', userId });
            setIsSaved(true);
        }
    }

    return (
        <div className="flex justify-between items-center z-20 py-1">
            <div className="flex gap-2 mr-5">
                <img src={checkIsLiked(userId, likesList) ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"} alt="like" height={20} width={20} onClick={handleLikePost} className="cursor-pointer" />
                <p className="small-mdeium lg:base-medium">{likes.length}</p>
            </div>

            <div className="flex gap-2">
                {isSavingPost || isDeletingSaved ? <Loader /> :
                    <img src={`/assets/icons/${isSaved ? 'saved' : 'save'}.svg`} alt="save" height={20} width={20} onClick={handleSavePost} className="cursor-pointer" />
                }
            </div>
        </div>
    )
}

export default PostStats