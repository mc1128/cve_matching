"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Check, 
  X, 
  AlertTriangle, 
  Star, 
  Package,
  Calendar,
  Info
} from "lucide-react"
import { api, type CPECandidate } from "@/lib/api-client"

interface CPECandidateModalProps {
  isOpen: boolean
  onClose: () => void
  componentId: number
  componentInfo: {
    vendor: string | null
    product: string
    version: string | null
  }
  candidates: CPECandidate[]
  onCPESelected: () => void
}

export function CPECandidateModal({
  isOpen,
  onClose,
  componentId,
  componentInfo,
  candidates,
  onCPESelected
}: CPECandidateModalProps) {
  const [selectedCPE, setSelectedCPE] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const handleSelectCPE = async (cpeString: string) => {
    if (!cpeString) return

    setIsSelecting(true)
    try {
      const result = await api.selectCPEManually(componentId, cpeString)
      
      if (result.success) {
        console.log(`✅ CPE 수동 선택 성공: ${cpeString}`)
        alert(`✅ CPE가 성공적으로 설정되었습니다!\n\nCPE: ${cpeString}`)
        onCPESelected() // 부모 컴포넌트에서 데이터 새로고침
        onClose()
      } else {
        console.error(`❌ CPE 수동 선택 실패:`, result)
        alert(`❌ CPE 설정에 실패했습니다.\n\n오류: ${result.message}`)
      }
    } catch (error) {
      console.error('CPE selection failed:', error)
      alert('❌ CPE 설정 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSelecting(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 0.6) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <Check className="h-3 w-3" />
    if (score >= 0.6) return <AlertTriangle className="h-3 w-3" />
    return <X className="h-3 w-3" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[60vw] min-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            CPE 후보 선택
          </DialogTitle>
          <DialogDescription>
            컴포넌트에 가장 적합한 CPE를 선택해주세요. 매칭도가 높을수록 정확한 취약점 분석이 가능합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 컴포넌트 정보 */}
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">대상 컴포넌트 정보:</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vendor:</span>{" "}
                <span className="font-medium">{componentInfo.vendor || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Product:</span>{" "}
                <span className="font-medium">{componentInfo.product}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span>{" "}
                <span className="font-medium">{componentInfo.version || "N/A"}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* 후보 목록 */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[60px]">선택</TableHead>
                  <TableHead className="w-[120px]">매칭도</TableHead>
                  <TableHead className="w-[300px]">제품명</TableHead>
                  <TableHead className="w-[150px]">Vendor</TableHead>
                  <TableHead className="w-[140px]">Version</TableHead>
                  <TableHead className="min-w-[500px]">CPE 문자열</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate, index) => (
                  <TableRow 
                    key={candidate.cpe_name}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedCPE === candidate.cpe_name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => setSelectedCPE(candidate.cpe_name)}
                  >
                    <TableCell className="text-center">
                      <Button
                        variant={selectedCPE === candidate.cpe_name ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectCPE(candidate.cpe_name)
                        }}
                        disabled={isSelecting}
                        className="h-8 w-8 p-0"
                      >
                        {selectedCPE === candidate.cpe_name ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`${getConfidenceColor(candidate.match_score)} flex items-center gap-1`}
                      >
                        {getConfidenceIcon(candidate.match_score)}
                        {(candidate.match_score * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{candidate.title}</div>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            최고 매칭
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{candidate.vendor || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{candidate.version || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {candidate.cpe_name}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            총 {candidates.length}개의 후보가 발견되었습니다.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSelecting}>
              취소
            </Button>
            <Button 
              onClick={() => selectedCPE && handleSelectCPE(selectedCPE)}
              disabled={!selectedCPE || isSelecting}
            >
              {isSelecting ? "설정 중..." : "선택한 CPE 적용"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
