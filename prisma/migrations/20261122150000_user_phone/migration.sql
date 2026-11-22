-- Sign up with a Saudi mobile number; email becomes optional.
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
