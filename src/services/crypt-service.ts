import * as CryptoJS from 'crypto-js';
import {env} from "@/env";

export class CryptService {
    private secret_key: string;

    constructor() {
        this.secret_key = env.JWT_SECRET
    }

    encript(text: string): string {
        return CryptoJS.AES.encrypt(text, this.secret_key).toString()
    }

    decrypt(encryptedText: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedText, this.secret_key)
        return bytes.toString(CryptoJS.enc.Utf8)
    }
}
