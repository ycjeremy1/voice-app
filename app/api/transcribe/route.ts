import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有找到文件" }, { status: 400 })
    }

    // 将 file 转成 Blob 然后变为 FormData 发送给 Python 后端
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    const pyForm = new FormData()
    pyForm.append("file", blob, file.name)

    // 调用本地 Python Whisper FastAPI 服务（确保它在本机运行）
    const res = await fetch("http://localhost:8000/transcribe", {
      method: "POST",
      body: pyForm,
    })

    const data = await res.json()

    return NextResponse.json({
      transcription: data.text, // 返回 Python 后端返回的转录内容
    })
  } catch (error) {
    console.error("调用本地 Whisper 失败:", error)
    return NextResponse.json({ error: "服务器错误，请稍后再试" }, { status: 500 })
  }
}
