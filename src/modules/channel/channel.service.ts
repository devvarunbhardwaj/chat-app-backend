import { prisma } from "@/config/database";
import { ApiError } from "@/utils/api-error";

export class ChannelService {
  async create(name: string, image: string) {
    const channel = await prisma.channel.create({
      data: { name, image },
    });

    return channel;
  }

  async update(id: string, name?: string, image?: string) {
    const existingChannel = await prisma.channel.findUnique({ where: { id } });
    if (!existingChannel) throw new ApiError(404, "Channel not found");

    const updatedChannel = await prisma.channel.update({
      where: { id },
      data: {
        name: name ?? existingChannel.name,
        image: image ?? existingChannel.image,
      },
    });

    return updatedChannel;
  }

  async get() {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: "desc" },
    });

    return channels;
  }

  async delete(id: string) {
    const existingChannel = await prisma.channel.findUnique({ where: { id } });
    if (!existingChannel) throw new ApiError(404, "Channel not found");

    await prisma.channel.delete({ where: { id } });

    return { message: "Channel deleted successfully" };
  }
}

export const channelService = new ChannelService();
