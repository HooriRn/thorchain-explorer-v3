import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const stats = await getStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
      },
      { status: 500 }
    )
  }
} 