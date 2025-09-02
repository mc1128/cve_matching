"use client"

import React, { useState } from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import ProcessorIcon from "@/components/icons/proccesor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { useAsset } from "@/lib/asset-context"

const mockAssetComponents = {
  1: [
    // WebServer-Prod-01
    {
      component_id: 1,
      component_type: "Operating System",
      vendor: "Ubuntu",
      product: "Ubuntu Server",
      version: "22.04.3 LTS",
      cpe_full_string: "cpe:2.3:o:canonical:ubuntu_linux:22.04.3:*:*:*:lts:*:*:*",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T14:22:00Z",
    },
    {
      component_id: 2,
      component_type: "Software",
      vendor: "Apache",
      product: "HTTP Server",
      version: "2.4.58",
      cpe_full_string: "cpe:2.3:a:apache:http_server:2.4.58:*:*:*:*:*:*:*",
      created_at: "2024-01-15T10:35:00Z",
      updated_at: "2024-01-20T14:22:00Z",
    },
    {
      component_id: 3,
      component_type: "Software",
      vendor: "OpenSSL",
      product: "OpenSSL",
      version: "3.0.12",
      cpe_full_string: "cpe:2.3:a:openssl:openssl:3.0.12:*:*:*:*:*:*:*",
      created_at: "2024-01-15T10:40:00Z",
      updated_at: "2024-01-20T14:22:00Z",
    },
  ],
  2: [
    // DB-Server-Main
    {
      component_id: 4,
      component_type: "Operating System",
      vendor: "Red Hat",
      product: "Enterprise Linux",
      version: "9.3",
      cpe_full_string: "cpe:2.3:o:redhat:enterprise_linux:9.3:*:*:*:*:*:*:*",
      created_at: "2024-01-10T09:15:00Z",
      updated_at: "2024-01-18T16:45:00Z",
    },
    {
      component_id: 5,
      component_type: "Software",
      vendor: "MySQL",
      product: "MySQL",
      version: "8.0.35",
      cpe_full_string: "cpe:2.3:a:mysql:mysql:8.0.35:*:*:*:*:*:*:*",
      created_at: "2024-01-10T09:20:00Z",
      updated_at: "2024-01-18T16:45:00Z",
    },
  ],
  3: [
    // Workstation-Dev-01
    {
      component_id: 6,
      component_type: "Operating System",
      vendor: "Microsoft",
      product: "Windows",
      version: "11 Pro",
      cpe_full_string: "cpe:2.3:o:microsoft:windows_11:*:*:*:*:*:*:*:*",
      created_at: "2024-01-12T11:20:00Z",
      updated_at: "2024-01-19T13:30:00Z",
    },
    {
      component_id: 7,
      component_type: "Software",
      vendor: "Google",
      product: "Chrome",
      version: "120.0.6099.109",
      cpe_full_string: "cpe:2.3:a:google:chrome:120.0.6099.109:*:*:*:*:*:*:*",
      created_at: "2024-01-12T11:25:00Z",
      updated_at: "2024-01-19T13:30:00Z",
    },
  ],
  4: [
    // Router-Gateway
    {
      component_id: 8,
      component_type: "Firmware",
      vendor: "Cisco",
      product: "IOS",
      version: "15.9(3)M8",
      cpe_full_string: "cpe:2.3:o:cisco:ios:15.9$$3$$m8:*:*:*:*:*:*:*",
      created_at: "2024-01-08T08:00:00Z",
      updated_at: "2024-01-22T10:15:00Z",
    },
  ],
}

const mockAssets = [
  {
    asset_id: 1,
    hostname: "WebServer-Prod-01",
    ip_address: "192.168.1.10",
    asset_type: "Server",
    owner_name: "KRIMSON",
    owner_user_id: 1,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:22:00Z",
  },
  {
    asset_id: 2,
    hostname: "DB-Server-Main",
    ip_address: "192.168.1.20",
    asset_type: "Server",
    owner_name: "MATI",
    owner_user_id: 2,
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-18T16:45:00Z",
  },
  {
    asset_id: 3,
    hostname: "Workstation-Dev-01",
    ip_address: "192.168.1.100",
    asset_type: "Laptop",
    owner_name: "PEK",
    owner_user_id: 3,
    created_at: "2024-01-12T11:20:00Z",
    updated_at: "2024-01-19T13:30:00Z",
  },
  {
    asset_id: 4,
    hostname: "Router-Gateway",
    ip_address: "192.168.1.1",
    asset_type: "Server",
    owner_name: "JOYBOY",
    owner_user_id: 4,
    created_at: "2024-01-08T08:00:00Z",
    updated_at: "2024-01-22T10:15:00Z",
  },
]

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

  const { selectedAsset, setSelectedAsset } = useAsset()

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch =
      asset.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.ip_address.includes(searchTerm) ||
      asset.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedAssetType === "all" || asset.asset_type === selectedAssetType

    return matchesSearch && matchesType
  })

  const stats = {
    total: mockAssets.length,
    servers: mockAssets.filter((a) => a.asset_type === "Server").length,
    laptops: mockAssets.filter((a) => a.asset_type === "Laptop").length,
    others: mockAssets.filter((a) => !["Server", "Laptop"].includes(a.asset_type)).length,
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const isExpanded = expandedAssets.has(asset.asset_id)
                  const components = mockAssetComponents[asset.asset_id as keyof typeof mockAssetComponents] || []

                  return (
                    <React.Fragment key={asset.asset_id}>
                      <TableRow
                        className="hover:bg-muted/50 cursor-pointer transition-all duration-200"
                        onClick={() => toggleAssetExpansion(asset.asset_id)}
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAssetIcon(asset.asset_type)}
                            <span className="font-medium">{asset.hostname}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{asset.ip_address}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.asset_type}</Badge>
                        </TableCell>
                        <TableCell>{asset.owner_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(asset.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-muted/20 border-t">
                              <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-400" />
                                    <h3 className="text-lg font-semibold">Asset Components</h3>
                                    <Badge variant="secondary">{components.length} components</Badge>
                                  </div>
                                  <Button variant="outline" size="sm" className="bg-transparent">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Component
                                  </Button>
                                </div>

                                {components.length > 0 ? (
                                  <div className="rounded-md border border-border/50">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/30">
                                          <TableHead>Type</TableHead>
                                          <TableHead>Vendor</TableHead>
                                          <TableHead>Product</TableHead>
                                          <TableHead>Version</TableHead>
                                          <TableHead>CPE String</TableHead>
                                          <TableHead>Updated</TableHead>
                                          <TableHead className="w-20">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {components.map((component) => (
                                          <TableRow
                                            key={component.component_id}
                                            className="hover:bg-muted/30 transition-colors"
                                          >
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-muted/50">
                                                  {getComponentIcon(component.component_type)}
                                                </div>
                                                <Badge
                                                  variant="outline"
                                                  className={`${getComponentTypeColor(component.component_type)} text-xs`}
                                                >
                                                  {component.component_type}
                                                </Badge>
                                              </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{component.vendor}</TableCell>
                                            <TableCell>{component.product}</TableCell>
                                            <TableCell className="font-mono text-sm">{component.version}</TableCell>
                                            <TableCell>
                                              {component.cpe_full_string && component.cpe_full_string.trim() !== "" ? (
                                                <code className="text-xs bg-muted/50 px-2 py-1 rounded border">
                                                  {component.cpe_full_string}
                                                </code>
                                              ) : (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-7 text-xs bg-transparent border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                                                >
                                                  <Shield className="h-3 w-3 mr-1" />
                                                  CPE AI 추론 요청
                                                </Button>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                              {new Date(component.updated_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm">
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <Card className="bg-card/30 backdrop-blur-sm border-border/30">
                                    <CardContent className="p-8 text-center">
                                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                      <p className="text-muted-foreground">No components found for this asset</p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Components will appear here once they are discovered or manually added
                                      </p>
                                      <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Component
                                      </Button>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filteredAssets.length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Click on any asset row to expand and view its installed components, software,
                and hardware details below
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
