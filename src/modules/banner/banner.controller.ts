import type { Request, Response } from "express";
import { bannerService } from "./banner.service";
import { catchAsync } from "../../utils/catch-async";
import { ApiResponse } from "../../utils/api-response";
import { ApiError } from "@/utils/api-error";

export class BannerController {
  create = catchAsync(async (req: Request, res: Response) => {
    const { title, image, link } = req.body;

    const result = await bannerService.create(title, image, link);
    const response = ApiResponse.created(result, "Banner created successfully");

    res.status(response.statusCode).json(response);
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(404, "Banner Id not found");

    const { title, image, link } = req.body;

    const result = await bannerService.update(id, title, image, link);
    const response = ApiResponse.success(result, "Banner updated successfully");

    res.status(response.statusCode).json(response);
  });

  get = catchAsync(async (_req: Request, res: Response) => {
    const result = await bannerService.get();
    const response = ApiResponse.success(result, "Banners fetched successfully");

    res.status(response.statusCode).json(response);
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(404, "Id not found");
    const result = await bannerService.delete(id);
    const response = ApiResponse.success(result, "Banner deleted successfully");

    res.status(response.statusCode).json(response);
  });
}

export const bannerController = new BannerController();
