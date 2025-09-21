import { NextRequest, NextResponse } from 'next/server'
import { getChainsHeight } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const chainsHeight = await getChainsHeight()
    
    return NextResponse.json({
      success: true,
      data: chainsHeight,
    })
  } catch (error) {
    console.error('Error fetching chains height:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chains height',
      },
      { status: 500 }
    )
  }
} 