import { prisma } from "@/config/database";
import { ApiError } from "@/utils/api-error";

export class CourseService {
  async create(name: string, image: string) {
    const course = await prisma.course.create({
      data: {
        name,
        image
      }
    });

    return course;
  }

  async update(id: string, name: string, image: string) {
    const existingCourse = await prisma.course.findUnique({ where: { id } })
    if (!existingCourse) throw new ApiError(404, "Course not found");

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name: name ?? existingCourse.name,
        image: image ?? existingCourse.image,
      }
    });

    return updatedCourse;
  }

  async get() {
    const courses = await prisma.course.findMany({ orderBy: { createdAt: "desc" } });
    if (!courses) throw new ApiError(500, "Failed to fetch banners");

    return courses;
  }

  async delete(id: string) {
    const existingCourse = await prisma.course.findUnique({ where: { id } })
    if (!existingCourse) throw new ApiError(404, "Course not found");

    await prisma.course.delete({ where: { id } });

    return { message: "Banner deleted successfully" };
  }
}

export const courseService = new CourseService();
