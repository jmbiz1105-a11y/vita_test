/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Phone, User, ShieldCheck, Zap, MessageSquare, ChevronRight, Star, X } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminDashboard from './AdminDashboard';

// --- Components ---

const CarrierButton = ({ name, selected, onClick }: { name: string, selected: boolean, onClick: () => void, key?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 font-medium ${
      selected 
        ? 'border-brand-yellow bg-amber-50 text-brand-yellow-dark shadow-sm' 
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
    }`}
  >
    {name}
  </button>
);

const TrustItem = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm">
    <div className="bg-brand-yellow/10 p-2 rounded-full">
      <Icon className="w-5 h-5 text-brand-yellow-dark" />
    </div>
    <span className="font-medium text-gray-800">{text}</span>
  </div>
);

const ReviewCard = ({ name, content, rating }: { name: string, content: string, rating: number }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3 h-full">
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
    <p className="text-gray-700 leading-relaxed whitespace-normal break-keep">"{content}"</p>
    <span className="text-sm text-gray-400 font-medium mt-auto">{name} 고객님</span>
  </div>
);

const CharacterImage = ({ type, className, noAnimation = false }: { type: 'excited' | 'thumbsup' | 'box' | 'success' | 'polite' | 'review', className: string, noAnimation?: boolean }) => {
  // Use different images for different sections if available
  let imageSrc = '/character.png';
  if (type === 'polite') imageSrc = '/character-2.png';
  if (type === 'excited') imageSrc = '/character-3.png';
  if (type === 'review') imageSrc = '/character-4.png';
  
  return (
    <motion.div 
      initial={noAnimation ? { opacity: 1 } : { y: 10, opacity: 0, rotate: -5 }}
      animate={noAnimation ? { opacity: 1 } : { 
        y: [0, -12, 0],
        rotate: [-3, 3, -3],
        opacity: 1
      }}
      transition={noAnimation ? {} : { 
        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
        opacity: { duration: 0.5 }
      }}
      className={`${className} flex items-center justify-center relative group`}
    >
      {/* Soft glow behind the transparent character */}
      <div className="absolute inset-0 bg-brand-yellow/15 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <img 
        src={imageSrc} 
        alt="Vitamin Character" 
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)]"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = "w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg relative z-10";
            fallback.innerText = 'V';
            parent.appendChild(fallback);
          }
        }}
      />
    </motion.div>
  );
};

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img 
        src="/logo.png" 
        alt="비타민인터넷 로고" 
        className="h-8 md:h-10 w-auto object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// --- Main App ---

const PrivacyModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const content = `비타민인터넷은 ' 정보통신망 이용촉진 및 정보보호 등에 관한 법률 ' 및 ' 개인정보보호법 ' 등 관련 법령을 준수하고 있으며 관련 법령에 따라 본 페이지에서 개인정보 처리방침을 공개합니다.

1. 수집하는 개인정보 항목 및 수집방법
2. 개인정보의 수집 및 이용목적
3. 개인정보의 보유 및 이용기간
4. 개인정보의 파기절차 및 방법
5. 개인정보 제공
6. 개인정보 처리위탁
7. 고객 및 법정대리인의 권리와 그 행사방법
8. 개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항
9. 개인정보의 기술적/관리적 보호 대책
10. 개인정보 보호책임자 및 상담

비타민인터넷(이하 '회사')는 고객의 개인정보를 중요시하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 통신비밀보호법 등 개인정보보호 관련 법규를 준수하고 있습니다.

회사는 개인정보처리방침을 통하여 고객의 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드리고 있습니다.

회사의 개인정보처리방침은 관련 법률 및 지침의 변경 또는 회사 내부방침의 변경에 의하여 변경될 수 있으며, 개인정보처리 방침이 변경될 경우 그 내용을 회사 홈페이지 공지사항을 통하여 공지할 것입니다.

1.수집하는 개인정보 항목 및 수집방법

(1) 수집하는 개인정보 항목
회사는 서비스 가입 및 변경, A/S 신청 등 원활한 서비스 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.

가. 서비스(방송/인터넷/인터넷전화/알뜰폰 등) 가입고객

수집 항목

개인정보 : 성명, 생년월일, 주소, 연락처(전화번호, 휴대폰번호, 이메일), 신분증 발급일자 및 발급기관, 동일인식별정보
결제정보 : 예금주, 생년월일, 예금주와의 관계, 계좌(신용정보)번호, 은행(카드)명, 카드 유효기간, 청구지 주소
고유식별정보 : 주민등록번호, 외국인등록번호
대리인정보 : 성명, 생년월일, 연락처, 신분증 발급일자 및 발급기관, 가입자와의관계, 법정대리인의 주민등록번호
※ 고유식별정보는 명의도용 방지, 요금감면, 미환급금 안내 등 관련 법령에 근거한 업무에만 활용합니다.

선택정보
추가 수집에 동의를 받은 경우
복지할인 대상 여부 확인을 위한 증명(독립유공자, 국가유공자, 수급자 증명서 등)
셋톱박스(STB)를 통해 등록한 개인계정 정보(ID, 비밀번호, 생년, 휴대폰번호)
가구 구성원 수 등

정보
방송 : 서비스 이용기록, 이용 콘텐츠 등
인터넷 : 접속로그, 쿠키, 접속IP, Mac Address 등
인터넷전화, 알뜰폰 : 통화내역, 통화시간, 단말기정보 등

나. 홈페이지/모바일 가입고객

구 분

수집 항목
홈페이지(개인) : 성명, 생년월일, 동일인식별정보, 아이디, 비밀번호, 휴대폰번호, 이메일
홈페이지(사업자) : 대표자명, 관리자명, 아이디, 비밀번호, 휴대폰번호, 이메일
모바일 : 성명, 생년월일, 성별, 아이디, 비밀번호, 단말기기종, 단말식별정보

선택정보
홈페이지(개인/사업자) : 주소

정보
서비스 이용기록, 이용 콘텐츠, 방문 일시, 쿠키, 접속IP

(2) 개인정보 수집방법
홈페이지(문의게시판, 상담신청, 최대지원금확인), 서면양식, 전화/팩스를 통한 회원가입, 배송 요청, 제휴사로부터의 제공, 신청인 댁 방문, 신규상품 개발 및 서비스 개선을 위한 설문조사, 셋톱박스(STB) 및 모바일을 통한 계정등록 등

2. 개인정보의 수집 및 이용목적

회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다
(1) 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
- 콘텐츠 제공, 구매 및 요금 결제, 물품배송 또는 청구서 등 발송, 금융거래 본인 인증 및 금융 서비스, 요금 추심 등

(2) 고객관리
- 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정이용 방지와 비인가 사용 방지, 가입의사 확인, 연령확인, 만14세 미만 아동의 개인정보 수집 시 법정 대리인 동의여부 확인, 불만처리 등 민원처리, 고지사항 전달

(3) 마케팅 및 광고에 활용
- 신규 서비스(제품) 개발 및 특화, 맞춤형 서비스 제공 및 소개, 이벤트 등 광고성 정보전달, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재

(4) 기타
- 요금납입의사 확인, 해지의사 확인, 접속 빈도 파악 및 서비스 이용에 대한 통계, 서비스만족도 조사 등

3. 개인정보의 보유 및 이용기간

회사는 회사 내부 방침 및 관계 법령에 근거하여 아래와 같이 수집한 개인정보를 보유 및 이용합니다.

(1) 회사는 고객의 개인정보를 서비스 가입기간 또는 분쟁처리 기간 동안 이용하고 요금정산, 요금과오납 등 분쟁 대비를 위해 후 6개월까지 보유합니다. 다만, 요금의 과납 또는 미납이 있을 경우와 분쟁이 있을 경우에는 해결일로부터 6개월까지 보유합니다.

(2) 홈페이지 및 모바일 고객이 서비스 이용 또는 접속이 1년 동안 없을 경우, ‘정보통신망 이용촉진 및 정보보호 등에 관한 법률' 제 29조에 근거하여 고객에게 사전고지 후 휴면회원으로 전환하고 개인정보를 별도 분리하여 보관합니다. 또한 휴면회원 전환 이후에도 1년간 서비스 재이용 또는 접속이 없을 경우에는 회원탈퇴 후 개인정보를 완전 파기합니다.

(3) 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 고객의 개인정보를 보관합니다.

- 보존 항목: 이름, 주민등록번호, 유무선 전화번호, 주소, 요금납부내역(청구액, 수납액, 수납일시, 요금납부 방법 등), 기타 거래에 관한 장비 및 서류
- 보존 근거: 국세기본법 제85조의 3
- 보존 기간: 문의 및 접수 상담 완료 후 6개월


- 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)
- 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)
- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래등에서의 소비자보호에 관한 법률)
- 신용정보의 수집/처리 및 이용 등에 관한 기록: 3년 (신용정보의 이용 및 보호에 관한 법률)
- 가입자의 전기통신일시, 전기통신개시·종료시간, 발·착신 통신번호 등 상대방의 가입자번호, 사용도수, 발신기지국의 위치정보 기록 : 12개월 단, 시외/시내전화 역무와 관련된 자료인 경우에는 6개월 (통신비밀보호법 시행령)

4. 개인정보의 파기절차 및 방법

회사는 개인정보 수집 및 이용목적이 달성된 후에는 다음과 같은 파기절차 및 방법으로 파기합니다.

(1) 파기절차
- 서비스 가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정기간 저장된 후 파기됩니다.
- 별도 DB로 옮겨진 개인정보는 회사의 회계(매출, 감사 등), 가입자의 이의제기로 인한 사실 확인, 수사기관의 적법한 수사 협조요청 등의 법률에 의한 경우가 아닌 다른 목적으로 이용되지 않습니다.

(2) 파기방법
- 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.
- 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.

5. 개인정보 제공

회사는 고객의 개인정보를 개인정보처리방침의 ‘개인정보의 이용목적’에서 고지한 범위 또는 이용약관에 명시한 범위 내에서 사용하며 동 범위를 넘어 이용하거나 제 3자에게 제공하지 않습니다.
다만, 다음과 같은 경우에는 고객의 개인정보를 이용하거나 제공할 수 있습니다.

- 서비스 제공에 따른 요금 정산을 위해 필요한 경우
- 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 전기통신사업법, 국세기본법 등 관련 법령에 특별한 규정이 있는 경 (법령에서 정해진 규정과 절차에 따라 제공)
- 고객에게 보다 다양한 서비스를 제공할 목적으로 제휴사에 개인정보 제공시 사전에 고객에게 별도 동의(서면, 전화, 홈페이지 등)를 받은 경우

6. 고객 및 법정대리인의 권리와 그 행사방법

고객 및 법정대리인은 언제든지 등록되어 있는 본인 또는 만14세 미만 아동의 개인정보를 조회하거나 수정할 수 있으며 가입 해지를 내부절차에 의해 요청할 수도 있습니다.
고객의 개인정보 조회, 수정은 홈페이지의 경우 ‘마이페이지’ 메뉴 ‘개인정보관리’에서 가능하며 회사의 서비스관리 프로그램의 경우 상담원(1877-2246)을 통해 변경 가능합니다. 서비스 해지(동의철회)를 위해서는 홈페이지의 경우 ‘마이페이지’의 ‘회원탈퇴' 경로에서 본인확인 절차를 거친 후 직접 열람, 정정 또는 탈퇴가 가능하며 모바일은 스마트폰상에서 앱을 삭제하기 전에 별도 경로(앱 > 'My Menu' > 설정)에서 회원탈퇴를 하셔야 합니다. 다만 서비스 관리 프로그램의 경우 본인확인 및 관련 서류 제출 후 서비스 해지가 가능합니다.
혹은 개인정보 보호책임자 또는 담당자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
고객이 개인정보 오류에 대한 정정을 요청한 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용, 제공하지 않습니다. 또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.
회사는 고객의 요청에 의해 해지 또는 삭제된 개인정보는 ‘개인정보의 보유 및 이용기간’에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.

7. 개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항

회사는 홈페이지를 운영하는데 있어 고객의 정보를 수시로 저장하고 찾아내는 ‘쿠키(cookie)’ 등을 운용합니다. 쿠키란 웹사이트를 운영하는데 이용되는 서버가 브라우저에 보내는 아주 작은 텍스트 파일로서 고객의 컴퓨터 하드디스크에 저장됩니다.

(1) 쿠키 등 사용 목적
회원과 비회원의 접속 빈도나 방문 시간 등을 분석, 이용자의 취향과 관심분야를 파악 및 자취 추적, 각종 이벤트 참여 정도 및 방문 회수 파악 등을 통한 타겟 마케팅 및 개인 맞춤 서비스를 제공하기 위해 사용합니다.

(2) 쿠키 설정 거부 방법
고객은 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서 고객은 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.
- 쿠키 설정을 거부하는 방법으로 고객은 사용하시는 웹 브라우저의 옵션을 선택함으로써 모든 쿠키를 허용하거나 쿠키를 저장할 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다. 단. 쿠키 설치를 거부하였을 경우에는 서비스 제공에 어려움이 있을 수 있습니다.
- 설정방법 예(인터넷 익스플로러를 사용할 경우): 웹 브라우저 상단의 도구 > 인터넷 옵션 > 개인정보

8. 개인정보의 기술적/관리적 보호 대책

회사는 고객의 개인정보가 분실, 도난, 유출, 변조 또는 훼손되지 않도록 안전성 확보를 위하여 아래와 같은 기술적, 관리적 대책을 적용하고 있습니다.

(1) 기술적 보호 대책
가. 고객의 개인정보는 비밀번호에 의해 보호되며 중요한 데이터는 별도의 보안기능을 통해 철저하게 보호되고 있습니다.
나. 백신프로그램을 설치하여 컴퓨터 바이러스, 스파이웨어 등 악성프로그램에 의한 고객의 개인정보가 유출되거나 훼손되는 것을 막고 있습니다.
다. 회사는 네트워크상에서 개인정보를 보호하기 위하여 보안장치를 적용하고 있습니다.

(2) 관리적 보호 대책
가. 회사는 개인정보 접근 및 관리에 필요한 절차를 마련하여 고객의 개인정보에 접근할 수 있는 자에게 이를 숙지하고 준수하도록 하고 있습니다.
나. 회사는 고객의 개인정보에 접근할 수 있는 자를 최소화하고 있으며 개인정보를 처리하고 있는 직원을 대상으로 정기적인 개인정보보호 교육을 실시하고 있습니다.
다. 신규직원 채용 시에는 정보보호서약서에 서명함으로써 직원에 의한 정보유출을 사전에 방지하고 이에 대한 준수 여부를 감시하기 위한 내부절차를 마련하여 지속적으로 시행하고 있습니다.
라. 회사는 개인정보보호를 위한 기술적/관리적 보호조치 이행을 수시로 점검하여 고객의 개인정보 유출로 인한 피해를 막기 위해 노력하고 있습니다.

9. 개인정보 보호책임자 및 상담

회사는 고객의 개인정보를 보호하고 개인정보와 관련한 문의사항을 처리하기 위하여 아래와 같이 개인정보 보호책임자 및 연락처를 지정하고 있습니다.

- 개인정보 보호책임자 : 박진석
- 개인정보 보호담당자 : 박진석
- 소속부서 : 고객지원실 정보보호팀
- 전화번호 : 070-7775-6771
- 이메일: jmbiz123@naver.com

고객은 회사의 서비스를 이용하며 발생하는 모든 개인정보보호 관련 민원을 개인정보 보호책임자 또는 관련 연락처로 신고하실 수 있습니다. 회사는 고객의 신고사항에 대해 신속하고 성실히 답변 드리겠습니다.

기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하실 수 있습니다.
1. 개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이118)
2. 개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)
3. 경찰청 사이버안전지킴이 ( www.police.go.kr/www/security/cyber.jsp / 국번없이 182)
4. 대검찰청 사이버수사과 ( http://www.spo.go.kr/ / 국번없이 1301)

- 개인정보처리방침 제정일자: 2023년 09월 05일
- 개인정보처리방침 시행일자: 2025년 08월 07일`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-bold text-gray-900">개인정보 수집·이용 동의</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
              {content}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-secret-view" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

function LandingPage() {
  const [carrier, setCarrier] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier || !name || !phone) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    if (!agreed) {
      setError('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'consultations'), {
        carrier,
        name,
        phone,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // Send SMS/Kakao notification via server
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, carrier })
        });
      } catch (notifyErr) {
        console.error('Notification failed:', notifyErr);
      }

      setIsSuccess(true);
      setCarrier('');
      setName('');
      setPhone('');
      setAgreed(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 text-gray-900 font-sans selection:bg-brand-yellow/20 selection:text-brand-yellow-dark">
      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-bottom border-amber-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-10" />
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white">
          <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content (PC) / Top Content (Mobile) */}
            <div className="flex-1 text-center lg:text-left w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.4] mb-8 tracking-tight">
                  <motion.span
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                    className="inline-block"
                  >
                    인터넷 가입,
                  </motion.span>
                  <br />
                  <motion.span 
                    initial={{ scale: 0, opacity: 0, rotate: -5 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 12,
                      delay: 0.6 
                    }}
                    className="relative inline-block px-4"
                  >
                    <motion.span
                      animate={{ 
                        color: ['#DC2626', '#EF4444', '#DC2626'],
                        scale: [1, 1.05, 1],
                        textShadow: [
                          "0 0 0px rgba(220, 38, 38, 0)",
                          "0 0 20px rgba(239, 68, 68, 0.4)",
                          "0 0 0px rgba(220, 38, 38, 0)"
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 text-red-600 inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black"
                    >
                      최고의 혜택
                    </motion.span>
                    <motion.div 
                      className="absolute bottom-1 left-0 w-full h-[30%] bg-red-100/60 -z-10 rounded-sm"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.2, duration: 0.6, ease: "circOut" }}
                      style={{ originX: 0 }}
                    />
                    <motion.div 
                      className="absolute -inset-2 bg-red-500/10 blur-xl -z-20 rounded-full"
                      animate={{ 
                        opacity: [0, 0.5, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="inline-block ml-2"
                  >
                    으로
                  </motion.span>
                  <br />
                  <motion.span
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4, type: "spring" }}
                    className="inline-block"
                  >
                    바로 안내드립니다.
                  </motion.span>
                </h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.8 }}
                  className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
                >
                  어디와 비교하셔도 좋습니다.<br className="hidden md:block" />
                  정확한 안내와 최고의 혜택을 자신합니다.
                </motion.p>

                <div className="hidden lg:flex flex-col gap-4 max-w-md">
                  <TrustItem icon={ShieldCheck} text="당일입금" />
                  <TrustItem icon={Zap} text="전국빠른설치" />
                  <TrustItem icon={MessageSquare} text="최대지원" />
                </div>
              </motion.div>
            </div>

            {/* Right Form (PC) / Bottom Form (Mobile) */}
            <div id="form-section" className="w-full lg:w-[450px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 relative"
              >
                <div className="absolute -top-20 right-0 hidden lg:block pointer-events-none select-none">
                  <CharacterImage type="thumbsup" className="w-48 h-48" />
                </div>

                <h2 className="text-2xl font-bold mb-8 text-center lg:text-left">빠른 무료 상담 신청</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">현재 사용 통신사</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {['KT', 'SK', 'LG', '기타', '없음'].map((c) => (
                        <CarrierButton 
                          key={c} 
                          name={c} 
                          selected={carrier === c} 
                          onClick={() => setCarrier(c)} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="성함 입력"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-amber-50/50 border-none rounded-2xl focus:ring-2 focus:ring-brand-yellow transition-all outline-none text-lg"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="전화번호 입력"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-amber-50/50 border-none rounded-2xl focus:ring-2 focus:ring-brand-yellow transition-all outline-none text-lg"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm font-medium text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-yellow hover:bg-brand-yellow-dark text-white py-5 rounded-2xl font-bold text-xl shadow-lg shadow-brand-yellow/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? '신청 중...' : '즉시 혜택 확인하기'}
                    {!isSubmitting && <ChevronRight className="w-6 h-6" />}
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${agreed ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-300 bg-white'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${agreed ? 'text-white' : 'text-gray-300'}`} />
                      </div>
                      <span className="flex-1">
                        개인정보 수집 및 이용에 관한 내용을 확인하고 동의함
                        <button 
                          type="button" 
                          onClick={() => setShowPrivacy(true)}
                          className="text-gray-400 underline decoration-gray-300 underline-offset-2 hover:text-gray-600 ml-1 inline-block"
                        >
                          [자세히 보기]
                        </button>
                      </span>
                    </label>
                    <p className="text-center text-[10px] text-gray-400">
                      * 입력하신 정보는 상담 목적으로만 사용됩니다.
                    </p>
                  </div>
                </form>

                <AnimatePresence>
                  {isSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 bg-white rounded-[40px] flex flex-col items-center justify-center p-8 text-center z-10"
                    >
                      <div className="w-24 h-24 mb-6">
                        <CharacterImage type="excited" className="w-full h-full" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">신청 완료!</h3>
                      <p className="text-gray-600 mb-8">담당자가 확인 후<br />빠르게 연락드리겠습니다.</p>
                      <button
                        onClick={() => setIsSuccess(false)}
                        className="text-brand-yellow-dark font-bold hover:underline"
                      >
                        확인
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mobile Trust Section */}
        <section className="lg:hidden px-4 py-8 bg-white">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-2 p-3 bg-amber-50/30 rounded-2xl border border-amber-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-brand-yellow-dark" />
              </div>
              <span className="font-bold text-[11px] text-gray-800">당일입금</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-amber-50/30 rounded-2xl border border-amber-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-brand-yellow-dark" />
              </div>
              <span className="font-bold text-[11px] text-gray-800">전국설치</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-amber-50/30 rounded-2xl border border-amber-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5 text-brand-yellow-dark" />
              </div>
              <span className="font-bold text-[11px] text-gray-800">최대지원</span>
            </div>
          </div>
        </section>

        {/* PC Trust Section */}
        <section className="hidden lg:block py-20 bg-white border-y border-amber-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-brand-yellow-dark" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">숨은 비용 없음</h4>
                  <p className="text-gray-500 text-sm">부가세, 설치비 등 모든 비용 포함 안내</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-brand-yellow-dark" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">상황에 맞는 상품 추천</h4>
                  <p className="text-gray-500 text-sm">베테랑들의 고객 맞춤 설계</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-brand-yellow-dark" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">부담 없는 상담</h4>
                  <p className="text-gray-500 text-sm">강요 없는 친절한 맞춤형 상담 서비스</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Review Section */}
        <section className="py-20 bg-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 mb-12">
            <div className="text-center relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-1/4 hidden xl:block pointer-events-none select-none">
                <CharacterImage type="review" className="w-40 h-40" noAnimation={true} />
              </div>
              <h2 className="text-3xl font-bold mb-4">실제 이용 고객 후기</h2>
              <p className="text-gray-500">많은 분들이 이미 혜택을 받고 계십니다.</p>
            </div>
          </div>

          {/* Infinite Scroll Marquee */}
          <div className="relative flex overflow-x-hidden group">
            <motion.div 
              className="flex gap-6 py-4 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ 
                duration: 30, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              {[
                { name: "김*현", content: "여러 군데 비교해봤는데 여기가 제일 설명이 깔끔하고 혜택도 좋았어요. 강추합니다!", rating: 5 },
                { name: "이*우", content: "복잡한 요금제 때문에 고민이었는데 상담사분이 딱 맞는 걸로 골라주셔서 편하게 가입했네요.", rating: 5 },
                { name: "박*지", content: "상담 신청하고 10분 만에 연락 와서 놀랐어요. 일 처리 정말 빠르시네요.", rating: 5 },
                { name: "최*준", content: "사은품 입금이 정말 당일에 바로 되네요. 믿고 가입하길 잘했습니다.", rating: 5 },
                { name: "정*아", content: "이사하면서 급하게 신청했는데 설치까지 일사천리로 진행해주셔서 감사합니다.", rating: 5 },
                { name: "한*민", content: "가족 결합 할인까지 꼼꼼하게 챙겨주셔서 통신비가 많이 절약됐어요.", rating: 5 },
                // Duplicate for seamless loop
                { name: "김*현", content: "여러 군데 비교해봤는데 여기가 제일 설명이 깔끔하고 혜택도 좋았어요. 강추합니다!", rating: 5 },
                { name: "이*우", content: "복잡한 요금제 때문에 고민이었는데 상담사분이 딱 맞는 걸로 골라주셔서 편하게 가입했네요.", rating: 5 },
                { name: "박*지", content: "상담 신청하고 10분 만에 연락 와서 놀랐어요. 일 처리 정말 빠르시네요.", rating: 5 },
                { name: "최*준", content: "사은품 입금이 정말 당일에 바로 되네요. 믿고 가입하길 잘했습니다.", rating: 5 },
                { name: "정*아", content: "이사하면서 급하게 신청했는데 설치까지 일사천리로 진행해주셔서 감사합니다.", rating: 5 },
                { name: "한*민", content: "가족 결합 할인까지 꼼꼼하게 챙겨주셔서 통신비가 많이 절약됐어요.", rating: 5 },
              ].map((review, index) => (
                <div key={index} className="w-[300px] md:w-[380px] flex-shrink-0">
                  <ReviewCard 
                    name={review.name} 
                    content={review.content} 
                    rating={review.rating} 
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Trust Certificates Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -top-16 right-20 hidden xl:block pointer-events-none select-none">
                <CharacterImage type="excited" className="w-56 h-56" noAnimation={true} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">비타민인터넷은 정식 승낙된 안전한 판매점입니다</h3>
              <p className="text-gray-500 mb-12">각종 인증서와 승낙서를 통해 신뢰할 수 있는 서비스를 약속드립니다.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                  { title: "유선통신 서비스 사전승낙서", desc: "KL19111129160U002", id: "consent" },
                  { title: "통신판매업 신고증", desc: "제 2020-용인기흥-2062 호", id: "business" },
                  { title: "상표등록증", desc: "40-1783780", id: "trademark" }
                ].map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="aspect-[3/4] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-4 transition-all hover:border-brand-yellow hover:bg-amber-50/30 overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                        <ShieldCheck className="w-24 h-24 text-gray-200 group-hover:text-brand-yellow/30" />
                      </div>
                      
                      {/* 
                        사용자 가이드: 
                        1. 왼쪽 파일 탐색기에서 src 폴더에 이미지 파일을 업로드하세요.
                        2. 파일명을 각각 cert-consent.jpg, cert-business.jpg, cert-trademark.jpg로 지정하세요.
                        3. 아래 img 태그의 src 주석을 해제하고 사용하세요.
                      */}
                      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                        <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                          <ShieldCheck className="w-8 h-8 text-brand-yellow-dark" />
                        </div>
                        <span className="text-sm font-bold text-gray-800 mb-1">{cert.title}</span>
                        <span className="text-xs text-gray-400">{cert.desc}</span>
                        
                        <img 
                          src={`/${cert.id}.jpg`} 
                          alt={cert.title}
                          className="absolute inset-0 w-full h-full object-contain p-2 bg-white transition-opacity duration-300"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0';
                            e.currentTarget.style.pointerEvents = 'none';
                          }}
                        /> 
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 md:py-20 bg-brand-green-dark relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-yellow rounded-full blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-brand-yellow rounded-full blur-[120px]" 
            />
          </div>
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <CharacterImage type="polite" className="w-64 md:w-80 h-64 md:h-80 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-10 tracking-tighter"
            >
              <motion.span
                animate={{ 
                  scale: [1, 1.05, 1],
                  textShadow: [
                    "0 0 20px rgba(255,255,255,0)",
                    "0 0 40px rgba(255,255,255,0.6)",
                    "0 0 20px rgba(255,255,255,0)"
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block relative"
              >
                <span className="bg-gradient-to-b from-white via-white to-amber-200 bg-clip-text text-transparent">
                  최고의 혜택 놓치지 마세요
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-200%]"
                  animate={{ translateX: ["200%", "-200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                />
              </motion.span>
            </motion.h2>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Logo className="h-6 brightness-0 invert" />
            </div>
          </div>
          <div className="text-[10px] leading-relaxed opacity-60">
            <p className="font-bold text-gray-400 mb-1">제이엠비즈(주)</p>
            <p>사업자등록번호 : 606-87-00212</p>
            <p>주소 : 경기도 용인시 기흥구 죽전로2</p>
            <p>E-mail : jmbiz123@hanmail.net | Tel. 1877-7212 | 정보관리 책임자 : 박진석</p>
            <p className="mt-4 uppercase">© 비타민인터넷. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}
