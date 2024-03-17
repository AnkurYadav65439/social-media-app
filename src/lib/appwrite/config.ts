import conf from '@/conf/conf';
import { Client, Account, Databases, Avatars, Storage} from 'appwrite';

export const client = new Client();

client
    .setEndpoint(conf.appwriteUrl)
    .setProject(conf.appwriteProjectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
//further inside api.ts