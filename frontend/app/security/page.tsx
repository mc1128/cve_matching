"use client"

import DashboardPageLayout from "@/components/dashboard/layout"
import CuteRobotIcon from "@/components/icons/cute-robot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Star, Play, Eye, Filter } from "lucide-react"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import { useCVE } from "@/lib/cve-context"
import { cn } from "@/lib/utils"

const mockData = mockDataJson as MockData

// Mock CVE data for the management page
const cveData = [
  {
    id: "CVE-2024-0001",
    summary: "Remote code execution vulnerability in Apache HTTP Server",
    cvss: 9.8,
    severity: "Critical" as const,
    status: "Pending Analysis" as const,
    publishedDate: "2024-01-15",
    lastModified: "2024-01-15",
    favorite: false,
    cpe: ["cpe:2.3:a:apache:http_server:2.4.58:*:*:*:*:*:*:*"],
    references: [
      "https://httpd.apache.org/security/vulnerabilities_24.html",
      "https://nvd.nist.gov/vuln/detail/CVE-2024-0001",
    ],
    aiAnalysis: {
      riskLevel: "Critical" as const,
      recommendation:
        "Immediate patching required. This vulnerability allows remote attackers to execute arbitrary code with server privileges.",
      affectedAssets: ["Web Server 01", "Web Server 02", "Load Balancer"],
    },
  },
  {
    id: "CVE-2024-0002",
    summary: "SQL injection in MySQL database connector",
    cvss: 8.1,
    severity: "High" as const,
    status: "Analysis Complete" as const,
    publishedDate: "2024-01-14",
    lastModified: "2024-01-14",
    favorite: true,
    cpe: ["cpe:2.3:a:mysql:mysql:8.0.35:*:*:*:*:*:*:*"],
    references: ["https://dev.mysql.com/doc/relnotes/mysql/8.0/en/", "https://nvd.nist.gov/vuln/detail/CVE-2024-0002"],
    aiAnalysis: {
      riskLevel: "Warning" as const,
      recommendation: "Update MySQL connector to latest version. Implement input validation and parameterized queries.",
      affectedAssets: ["Database Server", "API Gateway"],
    },
  },
  {
    id: "CVE-2024-0003",
    summary: "Cross-site scripting vulnerability in React components",
    cvss: 6.1,
    severity: "Medium" as const,
    status: "Analysis in Progress" as const,
    publishedDate: "2024-01-13",
    lastModified: "2024-01-13",
    favorite: false,
    cpe: ["cpe:2.3:a:facebook:react:18.2.0:*:*:*:*:*:*:*"],
    references: [
      "https://react.dev/blog/2024/01/13/react-security-update",
      "https://nvd.nist.gov/vuln/detail/CVE-2024-0003",
    ],
    aiAnalysis: {
      riskLevel: "Warning" as const,
      recommendation:
        "Update Express framework to version 4.19.0 or later. Review authentication middleware configuration.",
      affectedAssets: ["Node.js Applications", "API Services"],
    },
  },
  {
    id: "CVE-2024-0004",
    summary: "Buffer overflow in OpenSSL cryptographic library",
    cvss: 9.1,
    severity: "Critical" as const,
    status: "Pending Analysis" as const,
    publishedDate: "2024-01-12",
    lastModified: "2024-01-12",
    favorite: true,
    cpe: ["cpe:2.3:a:openssl:openssl:3.0.12:*:*:*:*:*:*:*"],
    references: ["https://www.openssl.org/news/secadv/20240112.txt", "https://nvd.nist.gov/vuln/detail/CVE-2024-0004"],
    aiAnalysis: {
      riskLevel: "Critical" as const,
      recommendation: "Critical security update required. This buffer overflow can lead to remote code execution.",
      affectedAssets: ["All SSL/TLS Services", "API Endpoints", "Web Applications"],
    },
  },
  {
    id: "CVE-2024-0005",
    summary: "Authentication bypass in Node.js Express framework",
    cvss: 7.5,
    severity: "High" as const,
    status: "Analysis Complete" as const,
    publishedDate: "2024-01-11",
    lastModified: "2024-01-11",
    favorite: false,
    cpe: ["cpe:2.3:a:nodejs:express:4.18.2:*:*:*:*:*:*:*"],
    references: [
      "https://expressjs.com/en/advanced/security-updates.html",
      "https://nvd.nist.gov/vuln/detail/CVE-2024-0005",
    ],
    aiAnalysis: {
      riskLevel: "Warning" as const,
      recommendation:
        "Update Express framework to version 4.19.0 or later. Review authentication middleware configuration.",
      affectedAssets: ["Node.js Applications", "API Services"],
    },
  },
]

function getSeverityColor(severity: string) {
  switch (severity) {
    case "Critical":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "High":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "Medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case "Low":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Pending Analysis":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "Analysis in Progress":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "Analysis Complete":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

export default function CVEManagementPage() {
  const { selectedCVE, setSelectedCVE } = useCVE()

  const handleCVEClick = (cve: (typeof cveData)[0]) => {
    setSelectedCVE(cve)
  }

  return (
    <DashboardPageLayout
      header={{
        title: "CVE Integrated Management",
        description: "Manage and analyze Common Vulnerabilities and Exposures",
        icon: CuteRobotIcon,
      }}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">2</div>
            <div className="text-sm text-muted-foreground">Critical CVEs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">2</div>
            <div className="text-sm text-muted-foreground">High CVEs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">2</div>
            <div className="text-sm text-muted-foreground">Pending Analysis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">2</div>
            <div className="text-sm text-muted-foreground">Favorites</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search by CVE ID, summary, or status..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Favorites Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CVE List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CVE Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>CVE ID</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>CVSS</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cveData.map((cve) => (
                <TableRow
                  key={cve.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedCVE?.id === cve.id && "bg-muted/50",
                    "hover:bg-muted/30",
                  )}
                  onClick={() => handleCVEClick(cve)}
                >
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Star
                        className={`h-4 w-4 ${
                          cve.favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{cve.id}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{cve.summary}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {cve.cvss}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(cve.severity)}>
                      {cve.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(cve.status)}>
                      {cve.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cve.publishedDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {cve.status === "Pending Analysis" && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
