import bcrypt from "bcrypt";
import { hashPassword } from "../../src/services/helpers/password.js";

describe("passwords", () => {
  describe("hashPassword", () => {
    const testPass1 = "some-password-123";
    const testPass2 = "different-one";

    it("Should return valid hash", async () => {
      const hash = await hashPassword(testPass1);

      const valid = await bcrypt.compare(testPass1, hash);

      expect(valid).toBe(true);
    });

    it("Should fail for dif passwords", async () => {
      const hash = await hashPassword(testPass1);

      const valid = await bcrypt.compare(testPass2, hash);

      expect(valid).toBe(false);
    });

    it("Should fail for nullish password", async () => {
      const hash = await hashPassword("");

      const valid = await bcrypt.compare(testPass1, hash);

      expect(valid).toBe(false);
    });
  });
});
