-- CreateTable
CREATE TABLE "public"."_ReelMentions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ReelMentions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ReelMentions_B_index" ON "public"."_ReelMentions"("B");

-- AddForeignKey
ALTER TABLE "public"."_ReelMentions" ADD CONSTRAINT "_ReelMentions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ReelMentions" ADD CONSTRAINT "_ReelMentions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
