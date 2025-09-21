import { NextRequest, NextResponse } from 'next/server'
import { getNodes } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const nodes = await getNodes()
    
    return NextResponse.json({
      success: true,
      data: nodes,
    })
  } catch (error) {
    console.error('Error fetching nodes:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch nodes',
      },
      { status: 500 }
    )
  }
} 