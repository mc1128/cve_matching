"use client"

import React, { useState } from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import ProcessorIcon from "@/components/icons/proccesor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Plus,
  Server,
  Monitor,
  Smartphone,
  Router,
  Edit,
  Trash2,
  Package,
  Cpu,
  HardDrive,
  Shield,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Link2,
  Zap,
} from "lucide-react"
import {
  useDevices,
  useAssetComponents,
  useRefreshData,
  usePrefetchData,
} from "@/hooks/use-api-query"
import { api } from "@/lib/api-client"
import type { Device, AssetComponent } from "@/lib/api-client"

function AssetComponents({ assetId }: { assetId: number }) {
  const { data: components, isLoading, error } = useAssetComponents(assetId)
  const [loadingCPE, setLoadingCPE] = React.useState<number | null>(null)

  // CPE 매칭 트리거 함수
  const handleCPEMatching = async (componentId: number) => {
    setLoadingCPE(componentId)
    try {
      await api.triggerCPEMatching(componentId)
      // 성공 시 컴포넌트 데이터 새로고침
      window.location.reload() // 임시적으로 페이지 새로고침
    } catch (error) {
      console.error('CPE matching failed:', error)
      alert('CPE 매칭에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoadingCPE(null)
    }
  }

  // 로딩 중이지만 데이터가 없는 경우에만 로딩 표시
  if (isLoading && !components) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="p-4 text-center">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="mr-3 h-5 w-5 animate-spin text-blue-500" />
            <span className="text-lg font-medium">Loading components...</span>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (error && !components) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="p-4 text-center">
          <div className="py-8 text-red-500">
            <div className="text-lg font-medium">Error loading components</div>
            <div className="text-sm mt-2">{error.message}</div>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (!components || components.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="p-4 text-center">
          <div className="py-12 text-slate-500 dark:text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <div className="text-lg font-medium">No components found</div>
            <div className="text-sm mt-2">This asset doesn't have any registered components yet.</div>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {/* Component details sub-table */}
      <TableRow>
        <TableCell colSpan={8} className="p-0">
          <div className="p-6 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-900/20 border-l-4 border-blue-500">
            <h4 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Components for this Asset 
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {components.length}
              </Badge>
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {components.length > 0 && "Scroll horizontally to view all columns on smaller screens"}
            </p>
            <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-auto bg-white dark:bg-slate-800 shadow-sm max-w-full">
              <div className="min-w-[1080px]"> {/* 최소 너비 보장 */}
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:from-slate-150 hover:to-slate-100 dark:hover:from-slate-750 dark:hover:to-slate-850 border-b-2 border-slate-200 dark:border-slate-600">
                      <TableHead className="w-[180px] font-bold text-slate-800 dark:text-slate-200 bg-blue-50 dark:bg-blue-900/30 border-r border-slate-200 dark:border-slate-600 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          Component Type
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] font-bold text-slate-800 dark:text-slate-200 bg-green-50 dark:bg-green-900/30 border-r border-slate-200 dark:border-slate-600 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-green-600" />
                          Vendor
                        </div>
                      </TableHead>
                      <TableHead className="w-[160px] font-bold text-slate-800 dark:text-slate-200 bg-purple-50 dark:bg-purple-900/30 border-r border-slate-200 dark:border-slate-600 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-purple-600" />
                          Product
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px] font-bold text-slate-800 dark:text-slate-200 bg-orange-50 dark:bg-orange-900/30 border-r border-slate-200 dark:border-slate-600 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-orange-600" />
                          Version
                        </div>
                      </TableHead>
                      <TableHead className="w-[240px] font-bold text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-900/30 border-r border-slate-200 dark:border-slate-600 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-amber-600" />
                          CPE
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] font-bold text-slate-800 dark:text-slate-200 bg-teal-50 dark:bg-teal-900/30 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-teal-600" />
                          Last Updated
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {components.map((component, index) => (
                    <TableRow 
                      key={component.component_id} 
                      className={`
                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}
                        hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-all duration-200 border-b border-slate-200 dark:border-slate-700
                      `}
                    >
                      <TableCell className="w-[180px] py-4 px-4 border-r border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-3">
                          {getComponentIcon(component.component_type)}
                          <Badge
                            variant="outline"
                            className={`border-2 font-medium text-xs ${getComponentTypeColor(
                              component.component_type
                            )}`}
                          >
                            {component.component_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="w-[140px] py-4 px-4 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600">
                        <div className="truncate" title={component.vendor || 'N/A'}>
                          {component.vendor || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="w-[160px] py-4 px-4 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-600">
                        <div className="truncate font-semibold" title={component.product}>
                          {component.product}
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] py-4 px-4 border-r border-slate-200 dark:border-slate-600">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs">
                          {component.version || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[240px] py-4 px-4 border-r border-slate-200 dark:border-slate-600">
                        {component.cpe_full_string ? (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 font-mono text-xs w-full justify-start"
                              title={component.cpe_full_string}
                            >
                              <Link2 className="h-3 w-3 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {component.cpe_full_string.length > 25 
                                  ? `${component.cpe_full_string.substring(0, 25)}...` 
                                  : component.cpe_full_string
                                }
                              </span>
                            </Badge>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCPEMatching(component.component_id)}
                            disabled={loadingCPE === component.component_id}
                            className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30 w-full text-xs"
                          >
                            {loadingCPE === component.component_id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Matching...
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3 mr-2" />
                                Match CPE
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="w-[140px] py-4 px-4 text-slate-600 dark:text-slate-400 text-sm">
                        <div className="text-center">
                          {new Date(component.updated_at).toLocaleDateString('ko-KR', {
                            year: '2-digit',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case "Server":
      return <Server className="h-4 w-4" />
    case "Laptop":
      return <Monitor className="h-4 w-4" />
    case "Mobile":
      return <Smartphone className="h-4 w-4" />
    case "Network":
      return <Router className="h-4 w-4" />
    default:
      return <Server className="h-4 w-4" />
  }
}

const getAssetTypeBadge = (type: string) => {
  switch (type) {
    case "Server":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 font-medium">
          <Server className="h-3 w-3 mr-1" />
          Server
        </Badge>
      )
    case "Workstation":
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 font-medium">
          <Monitor className="h-3 w-3 mr-1" />
          Workstation
        </Badge>
      )
    case "Laptop":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 font-medium">
          <Monitor className="h-3 w-3 mr-1" />
          Laptop
        </Badge>
      )
    case "Router":
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 font-medium">
          <Router className="h-3 w-3 mr-1" />
          Router
        </Badge>
      )
    case "Switch":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 font-medium">
          <Router className="h-3 w-3 mr-1" />
          Switch
        </Badge>
      )
    case "Mobile":
      return (
        <Badge className="bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800 font-medium">
          <Smartphone className="h-3 w-3 mr-1" />
          Mobile
        </Badge>
      )
    case "Network":
      return (
        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 font-medium">
          <Router className="h-3 w-3 mr-1" />
          Network
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="font-medium">
          <Package className="h-3 w-3 mr-1" />
          {type}
        </Badge>
      )
  }
}

const getComponentIcon = (type: string) => {
  switch (type) {
    case "Operating System":
      return <Shield className="h-4 w-4" />
    case "Software":
      return <Package className="h-4 w-4" />
    case "Hardware":
      return <Cpu className="h-4 w-4" />
    case "Firmware":
      return <HardDrive className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

const getComponentTypeColor = (type: string) => {
  switch (type) {
    case "Operating System":
      return "bg-blue-100/80 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
    case "Software":
      return "bg-green-100/80 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
    case "Hardware":
      return "bg-purple-100/80 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
    case "Firmware":
      return "bg-orange-100/80 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700"
    default:
      return "bg-gray-100/80 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700"
  }
}

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAssetType, setSelectedAssetType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set())

  const { data: assets, isLoading, error, refetch } = useDevices()
  const { refreshDevices } = useRefreshData()
  const { prefetchAssetComponents, prefetchMultipleAssetComponents } = usePrefetchData()

  const filteredAssets =
    assets?.filter((asset) => {
      const matchesSearch =
        asset.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.ip_address.includes(searchTerm) ||
        (asset.owner_name &&
          asset.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesType =
        selectedAssetType === "all" || asset.asset_type === selectedAssetType

      return matchesSearch && matchesType
    }) ?? []

  // 화면에 보이는 자산들의 컴포넌트를 백그라운드에서 미리 로드
  React.useEffect(() => {
    if (filteredAssets.length > 0 && filteredAssets.length <= 15) {
      // 15개 이하의 자산만 자동 프리페칭 (성능 고려)
      const assetIds = filteredAssets.map(asset => asset.asset_id);
      prefetchMultipleAssetComponents(assetIds).catch(() => {
        // 에러는 무시하고 계속 진행
      });
    }
  }, [filteredAssets, prefetchMultipleAssetComponents])

  const stats = {
    total: assets?.length ?? 0,
    servers: assets?.filter((a) => a.asset_type === "Server").length ?? 0,
    laptops: assets?.filter((a) => a.asset_type === "Laptop").length ?? 0,
    others:
      assets?.filter((a) => !["Server", "Laptop"].includes(a.asset_type))
        .length ?? 0,
  }

  const toggleAssetExpansion = (assetId: number) => {
    const newExpanded = new Set(expandedAssets)
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId)
    } else {
      newExpanded.add(assetId)
    }
    setExpandedAssets(newExpanded)
  }

  // 마우스 hover 시 프리페칭
  const handleAssetHover = async (assetId: number) => {
    if (!expandedAssets.has(assetId)) {
      try {
        await prefetchAssetComponents(assetId)
      } catch (error) {
        console.warn('Failed to prefetch asset components on hover:', error)
      }
    }
  }

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    refreshDevices()
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Asset Management",
        description: "Manage IT assets and their components for vulnerability assessment",
        icon: ProcessorIcon,
      }}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.servers}</div>
            <p className="text-xs text-muted-foreground">Servers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.laptops}</div>
            <p className="text-xs text-muted-foreground">Laptops</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">{stats.others}</div>
            <p className="text-xs text-muted-foreground">Other Devices</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by hostname, IP address, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Server">Server</SelectItem>
                <SelectItem value="Laptop">Laptop</SelectItem>
                <SelectItem value="Mobile">Mobile Device</SelectItem>
                <SelectItem value="Network">Network Device</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset Database ({filteredAssets.length} assets)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Click on any asset row to expand and view its installed components, software, and hardware details below
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="hostname">Hostname</Label>
                      <Input id="hostname" placeholder="e.g., WebServer-Prod-01" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ip-address">IP Address</Label>
                      <Input id="ip-address" placeholder="e.g., 192.168.1.10" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="asset-type">Asset Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="Mobile">Mobile Device</SelectItem>
                          <SelectItem value="Network">Network Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="owner">Owner</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">KRIMSON</SelectItem>
                          <SelectItem value="2">MATI</SelectItem>
                          <SelectItem value="3">PEK</SelectItem>
                          <SelectItem value="4">JOYBOY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(false)}>Add Asset</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
                  <TableHead className="w-8 px-3"></TableHead>
                  <TableHead className="w-[200px] px-4 font-semibold">Hostname</TableHead>
                  <TableHead className="w-[140px] px-4 font-semibold">IP Address</TableHead>
                  <TableHead className="w-[120px] px-4 font-semibold">Type</TableHead>
                  <TableHead className="w-[140px] px-4 font-semibold">Owner</TableHead>
                  <TableHead className="w-[110px] px-4 font-semibold">Created</TableHead>
                  <TableHead className="w-[110px] px-4 font-semibold">Updated</TableHead>
                  <TableHead className="w-[100px] text-right px-4 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Loading assets...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-red-500"
                    >
                      Error: {error?.message}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && filteredAssets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No assets found.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  !error &&
                  filteredAssets.map((asset, index) => {
                    const isExpanded = expandedAssets.has(asset.asset_id)
                    const isEvenRow = index % 2 === 0
                    return (
                      <React.Fragment key={asset.asset_id}>
                        <TableRow
                          className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                            isEvenRow 
                              ? 'bg-white dark:bg-slate-950' 
                              : 'bg-slate-50/50 dark:bg-slate-900/30'
                          }`}
                          onClick={() => toggleAssetExpansion(asset.asset_id)}
                          onMouseEnter={() => handleAssetHover(asset.asset_id)}
                        >
                          <TableCell className="w-8 px-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            )}
                          </TableCell>
                          <TableCell className="w-[200px] px-4">
                            <div className="flex items-center gap-2">
                              {getAssetIcon(asset.asset_type)}
                              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {asset.hostname}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="w-[140px] px-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                            {asset.ip_address}
                          </TableCell>
                          <TableCell className="w-[120px] px-4">
                            {getAssetTypeBadge(asset.asset_type)}
                          </TableCell>
                          <TableCell className="w-[140px] px-4 text-slate-700 dark:text-slate-300">
                            {asset.owner_name}
                          </TableCell>
                          <TableCell className="w-[110px] px-4 text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(asset.created_at).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="w-[110px] px-4 text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(asset.updated_at).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="w-[100px] text-right px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <React.Suspense 
                            fallback={
                              <TableRow>
                                <TableCell colSpan={8} className="p-4 text-center">
                                  <div className="flex items-center justify-center">
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Loading components...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            }
                          >
                            <AssetComponents assetId={asset.asset_id} />
                          </React.Suspense>
                        )}
                      </React.Fragment>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
