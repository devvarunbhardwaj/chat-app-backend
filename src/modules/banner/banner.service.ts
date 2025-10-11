import { prisma } from "@/config/database";
import { ApiError } from "@/utils/api-error";

export class BannerService {
  async create(title: string, image: string, link: string) {
    const banner = await prisma.banner.create({ data: { title, image, link } });

    return banner;
  }

  async update(id: string, title?: string, image?: string, link?: string) {
    const existingBanner = await prisma.banner.findUnique({ where: { id } });
    if (!existingBanner) throw new ApiError(404, "Banner not found");

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        title: title ?? existingBanner.title,
        image: image ?? existingBanner.image,
        link: link ?? existingBanner.link,
      },
    });

    return updatedBanner;
  }

  async get() {
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
    if (!banners) throw new ApiError(500, "Failed to fetch banners");

    return banners;
  }

  async delete(id: string) {
    const existingBanner = await prisma.banner.findUnique({ where: { id } });
    if (!existingBanner) throw new ApiError(404, "Banner not found");

    await prisma.banner.delete({ where: { id } });

    return { message: "Banner deleted successfully" };
  }
}

export const bannerService = new BannerService();

