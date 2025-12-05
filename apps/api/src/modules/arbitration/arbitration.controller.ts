import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiSecurity, ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { ArbitrationService } from "./arbitration.service"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { AuthGuard } from "../auth/guards/auth.guard"
import { AdminGuard } from "../auth/guards/admin.guard"
import { CreateArbitrationDto } from "./dto/create-arbitration.dto"
import { ListArbitrationsDto } from "./dto/list-arbitrations.dto"
import { ResolveArbitrationDto } from "./dto/resolve-arbitration.dto"
import { RateLimit, IpRateLimit } from "../../common/rate-limit"

@ApiTags("Arbitration")
@Controller("arbitration")
export class ArbitrationController {
  constructor(private readonly arbitrationService: ArbitrationService) {}

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Create arbitration for a request" })
  @ApiResponse({
    status: 201,
    description: "Arbitration created successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        requestId: { type: "string", format: "uuid" },
        chatId: { type: "string", format: "uuid" },
        status: { type: "string", enum: ["pending"] },
        createdAt: { type: "string", format: "date-time" },
      },
    },
  })
  @UseGuards(AuthGuard)
  @RateLimit({ limit: 5, ttl: 60000 }) // 5 requests per minute per account
  @IpRateLimit({ limit: 10, ttl: 60000 }) // 10 requests per minute per IP
  @Post("create")
  async create(@GetUser() user: User, @Body() dto: CreateArbitrationDto) {
    return this.arbitrationService.create(user, dto)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "List arbitrations (admin only)" })
  @ApiResponse({
    status: 200,
    description: "List of arbitrations",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              request: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  status: { type: "string" },
                  customer: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      firstName: { type: "string" },
                      lastName: { type: "string", nullable: true },
                      avatar: { type: "string", nullable: true },
                    },
                  },
                },
              },
              chat: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  isArbitration: { type: "boolean" },
                },
              },
              reason: { type: "string" },
              status: { type: "string", enum: ["pending", "resolved"] },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
        total: { type: "number" },
      },
    },
  })
  @UseGuards(AuthGuard, AdminGuard)
  @Get("list")
  async findAll(@Query() query: ListArbitrationsDto) {
    return this.arbitrationService.findAll(query)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Get arbitration by ID" })
  @ApiResponse({
    status: 200,
    description: "Arbitration details",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        request: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            status: { type: "string" },
            customer: {
              type: "object",
              properties: {
                id: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string", nullable: true },
                avatar: { type: "string", nullable: true },
              },
            },
          },
        },
        chat: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            isArbitration: { type: "boolean" },
          },
        },
        reason: { type: "string" },
        status: { type: "string", enum: ["pending", "resolved"] },
        createdAt: { type: "string", format: "date-time" },
      },
    },
  })
  @UseGuards(AuthGuard)
  @Get(":id")
  async findOne(@Param("id") id: string, @GetUser() user: User) {
    return this.arbitrationService.findOne(id, user)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Resolve arbitration (admin only)" })
  @ApiResponse({
    status: 200,
    description: "Arbitration resolved successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        status: { type: "string", enum: ["resolved"] },
        action: { type: "string", enum: ["approve_cancel", "complete", "reject"] },
        request: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            status: { type: "string" },
          },
        },
      },
    },
  })
  @UseGuards(AuthGuard, AdminGuard)
  @Post(":id/resolve")
  async resolve(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() dto: ResolveArbitrationDto
  ) {
    return this.arbitrationService.resolve(user, id, dto)
  }
}