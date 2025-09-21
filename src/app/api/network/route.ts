import { NextRequest, NextResponse } from 'next/server'
import { getNetwork } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const network = await getNetwork()
    
    return NextResponse.json({
      success: true,
      data: network,
    })
  } catch (error) {
    console.error('Error fetching network:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch network',
      },
      { status: 500 }
    )
  }
} 