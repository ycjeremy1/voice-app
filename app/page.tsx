"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileVideo, Download, Loader2, Play, Pause } from "lucide-react"
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
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // 检查文件类型
      if (selectedFile.type.startsWith("video/") || selectedFile.type.startsWith("audio/")) {
        setFile(selectedFile)
        setError("")
        setTranscription("")
      } else {
        setError("请选择视频或音频文件")
      }
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type.startsWith("video/") || droppedFile.type.startsWith("audio/")) {
        setFile(droppedFile)
        setError("")
        setTranscription("")
      } else {
        setError("请选择视频或音频文件")
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      // 模拟上传进度
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

      if (!response.ok) {
        throw new Error("转录失败")
      }

      const result = await response.json()
      setTranscription(result.transcription)
    } catch (err) {
      setError(err instanceof Error ? err.message : "转录过程中出现错误")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDownload = () => {
    if (!transcription) return

    const blob = new Blob([transcription], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${file?.name.split(".")[0] || "transcription"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleAudioPlayback = () => {
    if (!file || !audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">语音识别转录</h1>
          <p className="text-lg text-gray-600">上传视频或音频文件，自动转换为文字</p>
        </div>

        {/* 文件上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              文件上传
            </CardTitle>
            <CardDescription>支持 MP4, AVI, MOV, MP3, WAV 等格式，最大文件大小 100MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">拖拽文件到此处或点击选择文件</p>
              <p className="text-sm text-gray-500">支持视频和音频文件</p>
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
                  <div className="flex items-center gap-3">
                    <FileVideo className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {file.type.startsWith("audio/") && (
                      <Button variant="outline" size="sm" onClick={toggleAudioPlayback}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button onClick={handleUpload} disabled={isUploading} className="min-w-[100px]">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          转录中...
                        </>
                      ) : (
                        "开始转录"
                      )}
                    </Button>
                  </div>
                </div>

                {file.type.startsWith("audio/") && (
                  <audio
                    ref={audioRef}
                    src={URL.createObjectURL(file)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                )}
              </div>
            )}

            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>转录进度</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 转录结果 */}
        {transcription && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>转录结果</CardTitle>
                  <CardDescription>转录完成，共 {transcription.length} 个字符</CardDescription>
                </div>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下载文本
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="转录结果将显示在这里..."
                className="min-h-[300px] resize-none"
              />
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>您可以编辑上面的文本</span>
                <span>{transcription.split(/\s+/).length} 词</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <p className="text-gray-700">选择或拖拽视频/音频文件到上传区域</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <p className="text-gray-700">点击"开始转录"按钮，等待AI处理完成</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <p className="text-gray-700">查看转录结果，可以编辑文本并下载</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
