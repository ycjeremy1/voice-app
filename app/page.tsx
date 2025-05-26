"use client"

import { useState, useRef } from "react"
import { Upload, FileVideo, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SpeechRecognition() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [transcription, setTranscription] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type.startsWith("video/") || selectedFile.type.startsWith("audio/")) {
        setFile(selectedFile)
        setError("")
        setTranscription("")
      } else {
        setError("请选择视频或音频文件")
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setUploadProgress(0)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) throw new Error("转录失败")

      const result = await response.json()
      setTranscription(result.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "转录过程中出现错误")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">语音识别转录</h1>
          <p className="text-lg text-gray-600">上传视频或音频文件，自动转换为文字</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              文件上传
            </CardTitle>
            <CardDescription>支持 MP4, MP3, WAV 等格式，最大 100MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e as any) }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">拖拽或点击上传视频/音频</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-gray-800 font-medium">{file.name}</p>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        正在转录...
                      </>
                    ) : "开始转录"}
                  </Button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>进度</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {transcription && (
          <Card>
            <CardHeader>
              <CardTitle>转录结果</CardTitle>
              <CardDescription>Whisper 模型识别出的英文原文</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={transcription} readOnly className="min-h-[200px]" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
