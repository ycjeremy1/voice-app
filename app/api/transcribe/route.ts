import { type NextRequest, NextResponse } from "next/server"
import { transcribe } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有找到文件" }, { status: 400 })
    }

    // 检查文件大小 (100MB 限制)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小超过100MB限制" }, { status: 400 })
    }

    // 使用 AI SDK 的 transcribe 函数
    const { text } = await transcribe({
      model: openai("whisper-1"),
      file: file,
    })

    return NextResponse.json({
      transcription: text,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("转录错误:", error)
    return NextResponse.json({ error: "转录过程中出现错误，请稍后重试" }, { status: 500 })
  }
}
