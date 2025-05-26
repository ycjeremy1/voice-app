import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有找到文件" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    const pyForm = new FormData()
    pyForm.append("file", blob, file.name)

    // 仅调用本地 Whisper 模型进行转录，不再翻译
    const res = await fetch("http://localhost:8000/transcribe", {
      method: "POST",
      body: pyForm,
    })

    const data = await res.json()

    return NextResponse.json({
      text: data.text,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("处理失败:", error)
    return NextResponse.json({ error: "转录失败" }, { status: 500 })
  }
}

