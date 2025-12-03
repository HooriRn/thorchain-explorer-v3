import { NextRequest, NextResponse } from 'next/server'
import { getNodeOverview } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const nodeOverview = await getNodeOverview()
    
    return NextResponse.json({
      success: true,
      data: nodeOverview,
    })
  } catch (error) {
    console.error('Error fetching node overview:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch node overview',
      },
      { status: 500 }
    )
  }
} 