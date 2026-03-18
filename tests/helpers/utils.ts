import { hashPassword } from "@src/services/helpers/password.js";
import { randomRefresh } from "@src/services/helpers/tokens.js";
import type {
  PlainPassword,
  StoredRefreshToken,
  StoredRefreshTokenId,
  User,
  UserId,
} from "@src/types.js";
import crypto from "node:crypto";

const EMAILS = [
  "ivan",
  "i.glushko",
  "stas4eburek",
  "roma163",
  "alexei",
  "nikapro",
];
const AT = ["mail", "gmail", "susu", "yandex", "vk"];
const EXTENSIONS = ["com", "su", "ru"];

export const randomPassword = () =>
  crypto.randomBytes(8).toString() as PlainPassword;

export const randomStoredTokenId = () =>
  crypto.randomBytes(8).toString("hex") as StoredRefreshTokenId;

export const randomUserId = () =>
  crypto.randomBytes(8).toString("hex") as UserId;

const randomValueFromArray = <T>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

export const randomUserEmail = () => {
  const mail = randomValueFromArray(EMAILS);
  const at = randomValueFromArray(AT);
  const ext = randomValueFromArray(EXTENSIONS);
  return `${mail}@${at}.${ext}`;
};

export async function generateRandomUser(): Promise<User> {
  const now = Date.now();
  return {
    email: randomUserEmail(),
    id: randomUserId(),
    passwordHash: await hashPassword(randomPassword()),
    createdAt: now,
    updatedAt: now,
  };
}

export async function generateUserWithId(userId: UserId): Promise<User> {
  return { ...generateRandomUser(), id: userId };
}

export async function generateRandomUsers(n: number): Promise<User[]> {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(await generateRandomUser());
  }
  return result;
}

export function generateStoredRefreshToken(): StoredRefreshToken {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: randomStoredTokenId(),
    userId: randomUserId(),
    token: randomRefresh(),
    createdAt: now,
    expiresAt: now + 30 * 24 * 60 * 60,
  };
}

export function generateStoredRefreshTokens(n: number): StoredRefreshToken[] {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(generateStoredRefreshToken());
  }
  return result;
}

export function generateStoredRefreshTokensForUserId(
  n: number,
  userId: UserId,
): StoredRefreshToken[] {
  const result = generateStoredRefreshTokens(n);

  for (const entry of result) {
    entry.userId = userId;
  }

  return result;
}
