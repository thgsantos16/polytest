import { NextRequest, NextResponse } from "next/server";
import { walletMonitorService } from "../../../services/wallet-monitor-service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "start":
        await walletMonitorService.startMonitoring();
        return NextResponse.json({
          success: true,
          message: "Monitoring started successfully",
          status: "active",
        });

      case "stop":
        walletMonitorService.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: "Monitoring stopped successfully",
          status: "inactive",
        });

      case "status":
        const isActive = walletMonitorService.isActive();
        return NextResponse.json({
          success: true,
          status: isActive ? "active" : "inactive",
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in monitor API:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const isActive = walletMonitorService.isActive();
    return NextResponse.json({
      success: true,
      status: isActive ? "active" : "inactive",
      message: "Wallet monitoring service status",
    });
  } catch (error) {
    console.error("Error getting monitor status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
