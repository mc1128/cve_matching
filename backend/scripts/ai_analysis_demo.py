#!/usr/bin/env python3
"""
CVE AI 분석 시스템 데모 스크립트
AI 분석 기능의 전체 워크플로우를 보여줍니다.
"""

from cve_database import cve_system
import json
import time
from datetime import datetime

class CVEAIAnalysisDemo:
    def __init__(self):
        self.cve_system = cve_system
    
    def show_dashboard(self):
        """AI 분석 대시보드 표시"""
        print("🤖 CVE AI 분석 시스템 대시보드")
        print("=" * 60)
        
        # 통계 표시
        stats = self.cve_system.cves.get_ai_analysis_stats()
        print("\n📊 AI 분석 현황:")
        total_cves = sum(stat['count'] for stat in stats)
        
        status_info = {
            'pending': {'emoji': '⏳', 'name': '분석 대기'},
            'processing': {'emoji': '⚙️', 'name': '분석 중'},
            'completed': {'emoji': '✅', 'name': '분석 완료'},
            'failed': {'emoji': '❌', 'name': '분석 실패'},
            'skipped': {'emoji': '⏭️', 'name': '분석 생략'}
        }
        
        for stat in stats:
            status = stat['ai_analysis_status']
            info = status_info.get(status, {'emoji': '📋', 'name': status})
            print(f"  {info['emoji']} {info['name']}: {stat['count']}건 ({stat['percentage']}%)")
        
        print(f"\n📈 총 CVE 수: {total_cves}건")
    
    def show_analysis_queue(self):
        """AI 분석 대기열 표시"""
        print("\n⏳ AI 분석 대기열:")
        queue = self.cve_system.cves.get_ai_analysis_queue()
        
        if not queue:
            print("  📭 대기 중인 분석이 없습니다.")
            return
        
        for i, item in enumerate(queue, 1):
            waiting_time = str(item['waiting_time']).split('.')[0]
            severity_emoji = {
                'CRITICAL': '🚨',
                'HIGH': '🔴', 
                'MEDIUM': '🟡',
                'LOW': '🟢'
            }
            emoji = severity_emoji.get(item['cvss_severity'], '📋')
            
            status_emoji = {'pending': '⏳', 'processing': '⚙️'}
            status_icon = status_emoji.get(item['ai_analysis_status'], '📋')
            
            print(f"  {i}. {status_icon} {item['cve_id']}")
            print(f"     {emoji} {item['cvss_severity']} (CVSS: {item['cvss_score']})")
            print(f"     ⏰ 대기시간: {waiting_time}")
    
    def show_completed_analysis(self, cve_id):
        """완료된 AI 분석 리포트 표시"""
        print(f"\n🔍 AI 분석 리포트: {cve_id}")
        print("-" * 40)
        
        report = self.cve_system.cves.get_ai_analysis_report(cve_id)
        if not report or not report['ai_analysis_report']:
            print("  ❌ 분석 리포트가 없습니다.")
            return
        
        ai_report = json.loads(report['ai_analysis_report']) if isinstance(report['ai_analysis_report'], str) else report['ai_analysis_report']
        
        # 기본 정보
        print(f"📅 분석 요청: {report['ai_analysis_requested_at']}")
        print(f"✅ 분석 완료: {report['ai_analysis_completed_at']}")
        print(f"🎯 CVSS 점수: {report['cvss_score']} ({report['cvss_severity']})")
        
        # 심각도 분석
        severity = ai_report.get('severity_analysis', {})
        print(f"\n🚨 위험도 분석:")
        print(f"  위험 수준: {severity.get('risk_level', 'N/A')}")
        print(f"  비즈니스 영향: {severity.get('business_impact', 'N/A')}")
        print(f"  악용 가능성: {severity.get('exploitability', 'N/A')}")
        
        # 기술적 분석
        technical = ai_report.get('technical_analysis', {})
        print(f"\n⚙️ 기술적 분석:")
        print(f"  공격 벡터: {technical.get('attack_vector', 'N/A')}")
        print(f"  공격 복잡도: {technical.get('attack_complexity', 'N/A')}")
        print(f"  필요 권한: {technical.get('privileges_required', 'N/A')}")
        print(f"  사용자 상호작용: {technical.get('user_interaction', 'N/A')}")
        
        # 영향받는 시스템
        affected = ai_report.get('affected_systems', [])
        if affected:
            print(f"\n🎯 영향받는 시스템:")
            for system in affected:
                print(f"  • {system}")
        
        # 권장사항
        recommendations = ai_report.get('recommendations', [])
        if recommendations:
            print(f"\n💡 권장사항:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec}")
        
        # AI 분석 요약
        summary = ai_report.get('analysis_summary', '')
        if summary:
            print(f"\n📝 분석 요약:")
            print(f"  {summary}")
        
        # AI 신뢰도
        confidence = ai_report.get('ai_confidence', 0)
        print(f"\n🧠 AI 신뢰도: {confidence:.2%}")
    
    def simulate_ai_analysis(self, cve_id):
        """AI 분석 과정 시뮬레이션"""
        print(f"\n🤖 {cve_id} AI 분석 시뮬레이션")
        print("-" * 40)
        
        # 1단계: 분석 요청
        print("1️⃣ AI 분석 요청 중...")
        result = self.cve_system.cves.request_ai_analysis(cve_id)
        if result:
            print(f"   ✅ 분석 요청 완료: {result['ai_analysis_status']}")
        
        time.sleep(1)
        
        # 2단계: 분석 진행
        print("2️⃣ AI 분석 진행 중...")
        self.cve_system.cves.update_ai_analysis_status(cve_id, 'processing')
        print("   ⚙️ 분석 상태: processing")
        
        time.sleep(2)
        
        # 3단계: 분석 완료 및 리포트 저장
        print("3️⃣ AI 분석 완료 및 리포트 생성...")
        
        # 샘플 AI 분석 리포트 생성
        sample_report = {
            'severity_analysis': {
                'risk_level': 'High',
                'business_impact': 'Medium',
                'exploitability': 'Medium'
            },
            'technical_analysis': {
                'attack_vector': 'Network',
                'attack_complexity': 'Low',
                'privileges_required': 'None',
                'user_interaction': 'None'
            },
            'recommendations': [
                '즉시 보안 패치 적용',
                '네트워크 세분화 검토',
                '모니터링 강화'
            ],
            'affected_systems': ['Various systems'],
            'analysis_summary': f'{cve_id}에 대한 AI 기반 취약점 분석이 완료되었습니다.',
            'ai_confidence': 0.89,
            'analysis_version': '1.0',
            'analyzed_at': datetime.now().isoformat()
        }
        
        save_result = self.cve_system.cves.save_ai_analysis_report(cve_id, sample_report)
        if save_result:
            print(f"   ✅ 분석 완료: {save_result['ai_analysis_status']}")
            print(f"   📅 완료시간: {save_result['ai_analysis_completed_at']}")
    
    def run_demo(self):
        """전체 데모 실행"""
        print("🚀 CVE AI 분석 시스템 데모 시작")
        print("=" * 60)
        
        # 현재 상태 표시
        self.show_dashboard()
        self.show_analysis_queue()
        
        # 완료된 분석 예시
        print("\n" + "="*60)
        self.show_completed_analysis('CVE-2021-44228')
        
        # AI 분석 시뮬레이션
        print("\n" + "="*60)
        self.simulate_ai_analysis('CVE-2022-0778')
        
        # 업데이트된 상태 표시
        print("\n" + "="*60)
        print("📊 업데이트된 AI 분석 현황:")
        self.show_dashboard()
        
        print("\n🎉 CVE AI 분석 시스템 데모 완료!")

if __name__ == "__main__":
    demo = CVEAIAnalysisDemo()
    demo.run_demo()
