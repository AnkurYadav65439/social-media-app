import { account, databases, storage, avatars } from "./config";
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";
import conf from "@/conf/conf"
import { ID, Query } from "appwrite";

export async function createUserAccount(user: INewUser) {
    try {
        const createdUser = await account.create(ID.unique(), user.email, user.password, user.name);

        //?
        if (!createdUser) throw Error;

        const avatarUrl = avatars.getInitials(user.name)

        //as we are saving user to users collection in db from auth 
        const newUser = await saveUserToDB({
            accountId: createdUser.$id,
            name: createdUser.name,
            email: createdUser.email,
            username: user.username,
            imageUrl: avatarUrl,
        });

        return newUser;

    } catch (error) {
        throw error;
    }
}

export async function saveUserToDB(user: {
    accountId: string,
    name: string,
    username?: string,
    email: string,
    // imageId?: string,
    imageUrl: URL,
    // bio: string
}) {
    try {
        const newUser = await databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteUsersCollectionId,
            ID.unique(),
            user
        );
        return newUser;
    } catch (error) {
        throw error;
    }

}

export async function signInAccount(user: { email: string, password: string }) {
    try {
        const session = await account.createEmailSession(user.email, user.password);
        return session;
    } catch (error) {
        throw error;
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(conf.appwriteDatabaseId, conf.appwriteUsersCollectionId, [Query.equal('accountId', currentAccount.$id)]);

        if (!currentUser) throw Error;

        return currentUser.documents[0];

    } catch (error) {
        console.log("Appwrite service :: getCurrentUser() :: ", error);
    }
}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current");
        return session;
    } catch (error) {
        console.log("Appwrite service :: logout() :: ", error);
    }
}

//post
export async function createPost(post: INewPost) {
    try {
        //upload image to storage 
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw Error;

        //get file url
        const fileUrl = getFilePreview(uploadedFile.$id);

        if (!fileUrl) {
            //mayb uploaded file corrupted
            await deleteFile(uploadedFile.$id);
            throw Error;
        }

        //convert tags into array 
        const tags = post.tags?.replace(/ /g, '').split(',') || [];

        //upload newPost
        const newPost = await databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwritePostsCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            })

        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }

        return newPost;

    } catch (error) {
        console.log(error);
    }
}

export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(conf.appwriteBucketId, ID.unique(), file);

        return uploadedFile;

    } catch (error) {
        console.log(error);
    }

}

export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(conf.appwriteBucketId, fileId, 2000, 2000, "top", 100);

        return fileUrl;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(conf.appwriteBucketId, fileId);
        return { status: 'ok' };
    } catch (error) {
        console.log(error);
    }
}

export async function getRecentPosts() {
    const posts = await databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwritePostsCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
    )

    if (!posts) throw Error;
    return posts;
}

export async function likePost(postId: string, likesArray: string[]) {
    try {
        const updatedPost = await databases.updateDocument(conf.appwriteDatabaseId, conf.appwritePostsCollectionId, postId, { likes: likesArray });

        if (!updatedPost) throw Error;

        return updatedPost;
    } catch (error) {
        console.log(error);
    }

}

export async function savePost(postId: string, userId: string) {
    try {
        const savedPost = await databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteSavesCollectionId,
            ID.unique(),
            {
                user: userId,
                post: postId
            });

        if (!savedPost) throw Error;

        return savedPost;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteSavedPost(savedRecordId: string) {
    try {
        const statusCode = await databases.deleteDocument(
            conf.appwriteDatabaseId,
            conf.appwriteSavesCollectionId,
            savedRecordId
        )
        if (!statusCode) throw Error;

        return { status: "ok" };

    } catch (error) {
        console.log(error);
    }
}

export async function getPostById(postId: string) {
    try {
        const post = await databases.getDocument(conf.appwriteDatabaseId, conf.appwritePostsCollectionId, postId);

        return post;
    } catch (error) {
        console.log(error);
    }
}

export async function updatePost(post: IUpdatePost) {
    const hasFileToUpload = post.file.length > 0;

    try {
        let image = {
            imageUrl: post.imageUrl,
            imageId: post.imageId
        }
        if (hasFileToUpload) {
            //upload image to storage 
            const uploadedFile = await uploadFile(post.file[0]);

            if (!uploadedFile) throw Error;

            //get new file url
            const fileUrl = getFilePreview(uploadedFile.$id);

            if (!fileUrl) {
                //mayb uploaded file corrupted
                deleteFile(uploadedFile.$id);
                throw Error;
            }

            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }

        }

        //convert tags into array 
        const tags = post.tags?.replace(/ /g, '').split(',') || [];

        //finally update post
        const updatedPost = await databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwritePostsCollectionId,
            post.postId,
            {
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
                location: post.location,
                tags: tags
            })

        if (!updatedPost) {
            //delete new file 
            if (hasFileToUpload) {
                await deleteFile(image.imageId)
            }
            throw Error
        }

        //safely delete old file after ssuccessful updation
        if (hasFileToUpload) {
            await deleteFile(post.imageId);
        }
        return updatedPost;

    } catch (error) {
        console.log(error);
    }
}

export async function deletePost(postId: string, imageId: string) {
    if (!postId || !imageId) throw Error;

    try {
        //??? why not deleting file from storage here
        await databases.deleteDocument(conf.appwriteDatabaseId, conf.appwritePostsCollectionId, postId);

        return { status: 'ok' };
    } catch (error) {
        console.log(error);
    }
}

//invloves pagination
export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
    //pageParam is basicaly last document's id of prev loaded page(return by getNextPageParam after each page)
    const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(2)]

    if (pageParam) {
        queries.push(Query.cursorAfter(pageParam.toString()));
    }

    try {
        const posts = await databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwritePostsCollectionId,
            queries
        )

        if (!posts) throw Error;

        return posts;
    } catch (error) {
        console.log(error);
    }
}

export async function searchPosts(searchTerm: string) {
    try {
        const posts = databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwritePostsCollectionId,
            [Query.search('caption', searchTerm)]
        )
        if (!posts) throw Error;

        return posts;

    } catch (error) {
        console.log(error);
    }
}

//by own
//people(users)
export async function getUsers({ pageParam }: { pageParam: number }) {
    const queries: any[] = [Query.limit(2)]

    if (pageParam) {
        queries.push(Query.cursorAfter(pageParam.toString()));
    }

    try {
        const users = await databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteUsersCollectionId,
            queries
        )


        if (!users) throw Error;

        return users;
    } catch (error) {
        console.log(error);
    }
}

export async function getUserById(userId: string) {
    try {
        const user = await databases.getDocument(conf.appwriteDatabaseId, conf.appwriteUsersCollectionId, userId);

        return user;
    } catch (error) {
        console.log(error);
    }
}

export async function updateUser(user: IUpdateUser) {
    const hasFileToUpload = user.file.length > 0;

    try {
        let image = {
            //basically current file data
            imageUrl: user.imageUrl,
            imageId: user.imageId
        }
        if (hasFileToUpload) {
            // Upload new file to appwrite storage
            const uploadedFile = await uploadFile(user.file[0]);
            if (!uploadedFile) throw Error;

            //get new file url
            const fileUrl = getFilePreview(uploadedFile.$id);

            if (!fileUrl) {
                await deleteFile(uploadedFile.$id);
                throw Error;
            }

            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };


        }

        //finally update user
        const updatedUser = await databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwriteUsersCollectionId,
            user.userId,
            {
                name: user.name,
                bio: user.bio,
                imageId: image.imageId,
                imageUrl: image.imageUrl
            })

        if (!updatedUser) {
            // Delete new file that has been recently uploaded
            if (hasFileToUpload) {
                await deleteFile(image.imageId);
            }
            // If no new file uploaded, just throw error
            throw Error;
        }

        // Safely delete old file after successful update
        if (user.imageId && hasFileToUpload) {
            await deleteFile(user.imageId);
        }

        return updatedUser;
    } catch (error) {
        console.log(error);
    }
}