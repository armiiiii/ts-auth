import { hashPassword, verifyPassword } from "../../src/services/helpers/password.js";

describe("passwords", () => {
  const testPass1 = "some-password-123";
  const testPass2 = "different-one";

  it("Should return valid hash", async () => {
    const hash = await hashPassword(testPass1);

    const valid = await verifyPassword(testPass1, hash);

    expect(valid).toBe(true);
  });

  it("Should fail for dif passwords", async () => {
    const hash = await hashPassword(testPass1);

    const valid = await verifyPassword(testPass2, hash);

    expect(valid).toBe(false);
  });

  it("Should fail for nullish password", async () => {
    const hash = await hashPassword("");

    const valid = await verifyPassword(testPass1, hash);

    expect(valid).toBe(false);
  });

  it("Verify salting works", async () => {
    const hash1 = await hashPassword(testPass1);

    const hash2 = await hashPassword(hash1);

    expect(hash1).not.toBe(hash2);
  });
});
