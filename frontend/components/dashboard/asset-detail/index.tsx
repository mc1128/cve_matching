"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAsset } from "@/lib/asset-context"
import { Server, Monitor, Smartphone, Router, Package, HardDrive, Settings, Plus } from "lucide-react"

// Mock data for asset components
const mockAssetComponents = {
  1: [
    // WebServer01 components
    {
      component_id: 1,
      asset_id: 1,
      component_type: "OS" as const,
      vendor: "Ubuntu",
      product: "Ubuntu Server",
      version: "20.04.3 LTS",
      cpe_full_string: "cpe:2.3:o:canonical:ubuntu_linux:20.04:*:*:*:lts:*:*:*",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T14:22:00Z",
    },
    {
      component_id: 2,
      asset_id: 1,
      component_type: "Software" as const,
      vendor: "Apache",
      product: "HTTP Server",
      version: "2.4.41",
      cpe_full_string: "cpe:2.3:a:apache:http_server:2.4.41:*:*:*:*:*:*:*",
      created_at: "2024-01-15T10:35:00Z",
      updated_at: "2024-01-20T14:25:00Z",
    },
    {
      component_id: 3,
      asset_id: 1,
      component_type: "Software" as const,
      vendor: "PHP",
      product: "PHP",
      version: "7.4.3",
      cpe_full_string: "cpe:2.3:a:php:php:7.4.3:*:*:*:*:*:*:*",
      created_at: "2024-01-15T10:40:00Z",
      updated_at: "2024-01-20T14:30:00Z",
    },
  ],
  2: [
    // DatabaseServer components
    {
      component_id: 4,
      asset_id: 2,
      component_type: "OS" as const,
      vendor: "Red Hat",
      product: "Enterprise Linux",
      version: "8.5",
      cpe_full_string: "cpe:2.3:o:redhat:enterprise_linux:8.5:*:*:*:*:*:*:*",
      created_at: "2024-01-10T09:15:00Z",
      updated_at: "2024-01-18T16:45:00Z",
    },
    {
      component_id: 5,
      asset_id: 2,
      component_type: "Software" as const,
      vendor: "MySQL",
      product: "MySQL Server",
      version: "8.0.28",
      cpe_full_string: "cpe:2.3:a:oracle:mysql:8.0.28:*:*:*:*:*:*:*",
      created_at: "2024-01-10T09:20:00Z",
      updated_at: "2024-01-18T16:50:00Z",
    },
  ],
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case "Server":
      return <Server className="h-5 w-5" />
    case "Workstation":
      return <Monitor className="h-5 w-5" />
    case "Mobile":
      return <Smartphone className="h-5 w-5" />
    case "Network":
      return <Router className="h-5 w-5" />
    default:
      return <Server className="h-5 w-5" />
  }
}

const getComponentIcon = (type: string) => {
  switch (type) {
    case "OS":
      return <Settings className="h-4 w-4" />
    case "Software":
      return <Package className="h-4 w-4" />
    case "Hardware":
      return <HardDrive className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

const getComponentColor = (type: string) => {
  switch (type) {
    case "OS":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "Software":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "Hardware":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

export default function AssetDetail() {
  const { selectedAsset } = useAsset()

  if (!selectedAsset) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-4">
          <div className="relative">
            <Server className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Package className="h-3 w-3 text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Asset Components</h3>
            <p className="text-sm">Select an asset from the left panel to view its detailed component inventory</p>
            <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-xs text-muted-foreground">
                Components include OS, software, and hardware details with CPE matching for vulnerability assessment
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const components = mockAssetComponents[selectedAsset.asset_id as keyof typeof mockAssetComponents] || []

  return (
    <div className="space-y-4">
      {/* Asset Header */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAssetIcon(selectedAsset.asset_type)}
              <div>
                <CardTitle className="text-lg font-mono">{selectedAsset.hostname}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAsset.ip_address} • {selectedAsset.asset_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Owner:</span>
              <p className="font-medium">{selectedAsset.owner_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Components:</span>
              <p className="font-medium">{components.length} installed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-card/30 hover:bg-card/40 transition-colors">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-blue-400">
              {components.filter((c) => c.component_type === "OS").length}
            </div>
            <p className="text-xs text-muted-foreground">Operating Systems</p>
          </CardContent>
        </Card>
        <Card className="bg-card/30 hover:bg-card/40 transition-colors">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-green-400">
              {components.filter((c) => c.component_type === "Software").length}
            </div>
            <p className="text-xs text-muted-foreground">Software Packages</p>
          </CardContent>
        </Card>
        <Card className="bg-card/30 hover:bg-card/40 transition-colors">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-purple-400">
              {components.filter((c) => c.component_type === "Hardware").length}
            </div>
            <p className="text-xs text-muted-foreground">Hardware Components</p>
          </CardContent>
        </Card>
      </div>

      {/* Components List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Asset Components</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Detailed inventory of all installed components with CPE matching status
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {components.length > 0 ? (
            <div className="space-y-3">
              {components.map((component) => (
                <div
                  key={component.component_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/30 hover:bg-card/50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${getComponentColor(component.component_type)}`}>
                      {getComponentIcon(component.component_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{component.product}</span>
                        <Badge className={getComponentColor(component.component_type)} variant="outline">
                          {component.component_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {component.vendor} • v{component.version}
                      </div>
                      {component.cpe_full_string && (
                        <div className="text-xs font-mono text-muted-foreground mt-1 truncate max-w-[300px]">
                          {component.cpe_full_string}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {component.cpe_full_string ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ CPE Matched</Badge>
                    ) : (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">⚠ No CPE</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No components found for this asset</p>
              <p className="text-sm mt-1">Add components to enable vulnerability assessment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
