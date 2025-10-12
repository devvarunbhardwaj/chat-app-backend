import type { Request, Response } from "express";
import { channelService } from "./channel.service";
import { catchAsync } from "@/utils/catch-async";
import { ApiResponse } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export class ChannelController {
  create = catchAsync(async (req: Request, res: Response) => {
    const { name, image } = req.body;

    const result = await channelService.create(name, image);
    const response = ApiResponse.created(result, "Channel created successfully");

    res.status(response.statusCode).json(response);
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(404, "Channel ID not found");

    const { name, image } = req.body;

    const result = await channelService.update(id, name, image);
    const response = ApiResponse.success(result, "Channel updated successfully");

    res.status(response.statusCode).json(response);
  });

  get = catchAsync(async (_req: Request, res: Response) => {
    const result = await channelService.get();
    const response = ApiResponse.success(result, "Channels fetched successfully");

    res.status(response.statusCode).json(response);
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(404, "Channel ID not found");

    const result = await channelService.delete(id);
    const response = ApiResponse.success(result, "Channel deleted successfully");

    res.status(response.statusCode).json(response);
  });
}

export const channelController = new ChannelController();

