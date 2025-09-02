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
} from "lucide-react"
import {
  useDevices,
  useDeviceScan,
  useAssetComponents,
} from "@/hooks/use-api"
import type { Device, AssetComponent } from "@/lib/api-client"

function AssetComponents({ assetId }: { assetId: number }) {
  const { data: components, loading, error } = useAssetComponents(assetId)

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="p-4 text-center">
          <div className="flex items-center justify-center">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading components...</span>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="p-4 text-center text-red-500">
          Error loading components: {error}
        </TableCell>
      </TableRow>
    )
  }

  if (!components || components.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="p-4 text-center text-muted-foreground">
          No components found for this asset.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {/* Component details sub-table */}
      <TableRow>
        <TableCell colSpan={8} className="p-0">
          <div className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-2 text-base">
              Components for this Asset ({components.length})
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((component) => (
                  <TableRow key={component.component_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getComponentIcon(component.component_type)}
                        <Badge
                          variant="outline"
                          className={`border-2 ${getComponentTypeColor(
                            component.component_type
                          )}`}
                        >
                          {component.component_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{component.vendor}</TableCell>
                    <TableCell>{component.product}</TableCell>
                    <TableCell>{component.version}</TableCell>
                    <TableCell>
                      {new Date(component.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "Software":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "Hardware":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "Firmware":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAssetType, setSelectedAssetType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set())

  const { data: assets, loading, error, refetch } = useDevices()

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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
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
                      Error: {error}
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !error && filteredAssets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No assets found.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  !error &&
                  filteredAssets.map((asset) => {
                    const isExpanded = expandedAssets.has(asset.asset_id)
                    return (
                      <React.Fragment key={asset.asset_id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleAssetExpansion(asset.asset_id)}
                        >
                          <TableCell className="w-8">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getAssetIcon(asset.asset_type)}
                              <span className="font-medium">
                                {asset.hostname}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {asset.ip_address}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{asset.asset_type}</Badge>
                          </TableCell>
                          <TableCell>{asset.owner_name}</TableCell>
                          <TableCell>
                            {new Date(asset.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(asset.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mr-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <AssetComponents assetId={asset.asset_id} />
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
