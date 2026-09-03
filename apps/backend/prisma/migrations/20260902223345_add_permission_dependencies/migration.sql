-- CreateTable
CREATE TABLE "PermissionDependency" (
    "permissionId" INTEGER NOT NULL,
    "dependsOnId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionDependency_pkey" PRIMARY KEY ("permissionId","dependsOnId")
);

-- AddForeignKey
ALTER TABLE "PermissionDependency" ADD CONSTRAINT "PermissionDependency_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionDependency" ADD CONSTRAINT "PermissionDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
