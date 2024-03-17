import { INewPost, INewUser } from "@/types";
import conf from "../conf/conf"
import { Client, Account, Databases, Storage, ID, Avatars, Query } from "appwrite";
//Query also there form appwrite but we use react query(signupform compn.)

//custom class (can be used an any appli.)
export class AuthService {
    client = new Client();
    account;
    databases;
    storage;
    avatars;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
        this.storage = new Storage(this.client);
        this.avatars = new Avatars(this.client)
    }

    async createUserAccount(user: INewUser) {
        try {
            const createdUser = await this.account.create(ID.unique(), user.email, user.password, user.name);

            //?
            if (!createdUser) throw Error;

            const avatarUrl = this.avatars.getInitials(user.name)

            //as we are saving user to users collection in db from auth 
            const newUser = await this.saveUserToDB({
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

    async saveUserToDB(user: {
        accountId: string,
        name: string,
        username?: string,
        email: string,
        // imageId?: string,
        imageUrl: URL,
        // bio: string
    }) {
        try {
            const newUser = await this.databases.createDocument(
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

    async signInAccount(user: { email: string, password: string }) {
        try {
            const session = await this.account.createEmailSession(user.email, user.password);
            return session;
        } catch (error) {
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const currentAccount = await this.account.get();

            if (!currentAccount) throw Error;

            const currentUser = await this.databases.listDocuments(conf.appwriteDatabaseId, conf.appwriteUsersCollectionId, [Query.equal('accountId', currentAccount.$id)]);

            if (!currentUser) throw Error;

            return currentUser.documents[0];

        } catch (error) {
            console.log("Appwrite service :: getCurrentUser() :: ", error);
        }
    }

    async signOutAccount() {
        try {
            const session = await this.account.deleteSession("current");
            return session;
        } catch (error) {
            console.log("Appwrite service :: logout() :: ", error);
        }
    }

    //post
    async createPost(post: INewPost) {
        try {
            //upload image to storage 
            const uploadedFile = await this.uploadFile(post.file[0]);
            console.log("uploaded is ", uploadedFile);

            if (!uploadedFile) throw Error;

            //get file url
            const fileUrl = await this.getFilePreview(uploadedFile.$id);
            console.log("fileurl is ", fileUrl);

            if (!fileUrl) {
                //mayb uploaded file corrupted
                await this.deleteFile(uploadedFile.$id);
            }

            //convert tags into array 
            const tags = post.tags?.replace(/ /g, '').split(',') || [];
            console.log("tags is ", tags);

            //upload newPost
            const newPost = await this.databases.createDocument(
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
                await this.deleteFile(uploadedFile.$id)
                throw Error
            }

            return newPost;

        } catch (error) {
            console.log(error);
        }
    }

    async uploadFile(file: File) {
        try {
            const uploadedFile = await this.storage.createFile(conf.appwriteBucketId, ID.unique(), file);

            return uploadedFile;

        } catch (error) {
            console.log(error);
        }

    }

    async getFilePreview(fileId: string) {
        try {
            const fileUrl = await this.storage.getFilePreview(conf.appwriteBucketId, fileId, 2000, 2000, "top", 100);

            return fileUrl;
        } catch (error) {
            console.log(error);
        }
    }

    async deleteFile(fileId: string) {
        try {
            await this.storage.deleteFile(conf.appwriteBucketId, fileId);
            return { status: 'ok' };
        } catch (error) {
            console.log(error);
        }
    }

    async getRecentPosts() {

        try {
            console.log("inside getrecentsposts")
            const posts = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwritePostsCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(20)]
            )

            console.log("posts is", posts);
            if (!posts) throw Error;
            return posts;

        } catch (error) {
            console.log(error);
        }
    }

    // till 3:38, but then react-query getRecentPosts conflict with 'this.databases' 
    // directed us to make new lib->appwrite folder(setup appwrite without class) 

}

const authService = new AuthService();
export default authService;



/*
//copied from appwrite docs to make our custom class from it//
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('<PROJECT_ID>');               // Your project ID

const account = new Account(client);
*/