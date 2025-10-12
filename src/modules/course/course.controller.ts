import type { Request, Response } from "express";
import { courseService } from "./course.service";
import { catchAsync } from "@/utils/catch-async";
import { ApiResponse } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export class CourseController {
  create = catchAsync(async (req: Request, res: Response) => {
    const { name, image } = req.body;

    const result = await courseService.create(name, image,);
    const response = ApiResponse.created(result, "Course created successfully");

    res.status(response.statusCode).json(response);
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(404, "Course Id not found");

    const { name, image } = req.body;

    const result = await courseService.update(id, name, image);
    const response = ApiResponse.success(result, "Course updated successfully");

    res.status(response.statusCode).json(response);
  });

  get = catchAsync(async (_req: Request, res: Response) => {
    const result = await courseService.get();
    const response = ApiResponse.success(result, "Course fetched successfully");

    res.status(response.statusCode).json(response);
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(404, "Course Id not found");
    const result = await courseService.delete(id);
    const response = ApiResponse.success(result, "Course deleted successfully");

    res.status(response.statusCode).json(response);
  });
}

export const courseController = new CourseController();
