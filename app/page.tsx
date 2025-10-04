'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  getDay
} from 'date-fns';

// --- 타입 정의 ---
interface Schedule { [key: string]: string[]; }
interface Holiday { date: string; localName: string; name: string; }
interface TooltipData { visible: boolean; content: string; x: number; y: number; }
interface EditingScheduleInfo { date: Date; index: number; text: string; }

// --- 메인 컴포넌트 ---
export default function ContributionCalendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState<Schedule>({});
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newScheduleText, setNewScheduleText] = useState('');
  const [editingScheduleInfo, setEditingScheduleInfo] = useState<EditingScheduleInfo | null>(null);
  const [editedScheduleText, setEditedScheduleText] = useState('');
  const [scheduleType, setScheduleType] = useState('personal');

  // --- 데이터 로딩 ---
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/KR`);
        if (!response.ok) throw new Error('Failed to fetch holidays');
        setHolidays(await response.json());
      } catch (error) { console.error("Error fetching holidays:", error); setHolidays([]); }
    };
    fetchHolidays();
  }, [currentYear]);

  useEffect(() => {
    const today = new Date();
    if (currentYear === today.getFullYear()) {
      setSelectedDay(today);
    } else {
      setSelectedDay(null);
    }
  }, [currentYear]);

  // --- 날짜 계산 ---
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 11, 31));
  const gridStart = startOfWeek(yearStart);
  const gridEnd = endOfWeek(yearEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // --- 이벤트 핸들러 ---
  const handleScheduleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => { setScheduleType(e.target.value); };
  const prevYear = () => { setCurrentYear(currentYear - 1); };
  const nextYear = () => { setCurrentYear(currentYear + 1); };
  const goToCurrentYear = () => { setCurrentYear(new Date().getFullYear()); };
  const handleDayClick = (day: Date) => { setSelectedDay(day); };

  const handleAddModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleText || !selectedDay) return;
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const existing = schedules[dateKey] || [];
    setSchedules({ ...schedules, [dateKey]: [...existing, newScheduleText] });
    setNewScheduleText('');
    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (date: Date, index: number) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    const dateKey = format(date, 'yyyy-MM-dd');
    const daySchedules = schedules[dateKey] || [];
    const newSchedules = daySchedules.filter((_, i) => i !== index);
    setSchedules({ ...schedules, [dateKey]: newSchedules });
  };

  const handleEditClick = (date: Date, index: number, text: string) => {
    setEditingScheduleInfo({ date, index, text });
    setEditedScheduleText(text);
    setIsEditModalOpen(true);
  };

  const handleEditModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedScheduleText || !editingScheduleInfo) return;
    const { date, index } = editingScheduleInfo;
    const dateKey = format(date, 'yyyy-MM-dd');
    const daySchedules = [...(schedules[dateKey] || [])];
    daySchedules[index] = editedScheduleText;
    setSchedules({ ...schedules, [dateKey]: daySchedules });
    setIsEditModalOpen(false);
    setEditingScheduleInfo(null);
  };

  const handleMouseOver = (e: React.MouseEvent, day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const holidayInfo = holidays.find(h => h.date === dateKey);
    const daySchedules = schedules[dateKey] || [];
    let tooltipText = dateKey;
    if (holidayInfo) tooltipText += `\n${holidayInfo.localName}`;
    if (daySchedules.length > 0) tooltipText += `\n\n일정 (${daySchedules.length}개):\n- ${daySchedules.join('\n- ')}`;
    setTooltip({ visible: true, content: tooltipText, x: e.clientX, y: e.clientY });
  };

  const handleMouseOut = () => { setTooltip({ ...tooltip, visible: false }); };

  const getScheduleCountClass = (count: number) => {
    if (count === 0) return '';
    if (count === 1) return 'has-schedule';
    if (count <= 3) return 'has-schedule-2';
    if (count <= 5) return 'has-schedule-3';
    return 'has-schedule-4';
  };

  const selectedDayInfo = {
      schedules: selectedDay ? schedules[format(selectedDay, 'yyyy-MM-dd')] || [] : [],
      holiday: selectedDay ? holidays.find(h => h.date === format(selectedDay, 'yyyy-MM-dd')) : null
  };

  return (
    <div className="container">
      {tooltip.visible && <div className="custom-tooltip" style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}>{tooltip.content}</div>}

      {isAddModalOpen && selectedDay && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{format(selectedDay, 'yyyy-MM-dd')}</h3>
            <form onSubmit={handleAddModalSubmit}>
              <textarea placeholder="새 일정 내용" value={newScheduleText} onChange={(e) => setNewScheduleText(e.target.value)} autoFocus required />
              <div className="modal-actions">
                <button type="button" className="modal-button-secondary" onClick={() => setIsAddModalOpen(false)}>취소</button>
                <button type="submit" className="modal-button-primary">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingScheduleInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>일정 수정</h3>
            <form onSubmit={handleEditModalSubmit}>
              <textarea value={editedScheduleText} onChange={(e) => setEditedScheduleText(e.target.value)} autoFocus required />
              <div className="modal-actions">
                <button type="button" className="modal-button-secondary" onClick={() => setIsEditModalOpen(false)}>취소</button>
                <button type="submit" className="modal-button-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="calendar-wrapper">
        <div className="header">
          <button onClick={prevYear} className="icon-button" title="이전 해">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button onClick={nextYear} className="icon-button" title="다음 해">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          <button onClick={goToCurrentYear}>올해</button>
          <h2>{currentYear}년</h2>
        </div>
        <div className="year-view-container">
          <div className="grid-header">
            <h4>{currentYear}년 활동 요약</h4>
            <div className="schedule-type-selector">
              <input type="radio" id="personal" name="scheduleType" value="personal" checked={scheduleType === 'personal'} onChange={handleScheduleTypeChange} />
              <label htmlFor="personal">나의 일정</label>

              <input type="radio" id="github" name="scheduleType" value="github" checked={scheduleType === 'github'} onChange={handleScheduleTypeChange} />
              <label htmlFor="github">GitHub</label>

              <input type="radio" id="shared" name="scheduleType" value="shared" checked={scheduleType === 'shared'} onChange={handleScheduleTypeChange} />
              <label htmlFor="shared">공유 일정</label>
            </div>
          </div>
          <div className="calendar-body">
            <div className="day-labels">
              <div className="day-label">S</div>
              <div className="day-label">M</div>
              <div className="day-label">T</div>
              <div className="day-label">W</div>
              <div className="day-label">T</div>
              <div className="day-label">F</div>
              <div className="day-label">S</div>
            </div>
            <div className="calendar-grid">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayOfWeek = getDay(day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const holidayInfo = holidays.find(h => h.date === dateKey);
                let cellClass = 'day-cell';
                if (isWeekend || holidayInfo) cellClass += ' is-holiday';
                else cellClass += ` ${getScheduleCountClass(schedules[dateKey]?.length || 0)}`;
                if (isToday(day)) cellClass += ' is-today';
                if (selectedDay && isSameDay(day, selectedDay)) cellClass += ' is-selected';
                if (day.getFullYear() !== currentYear) return <div key={dateKey} className="day-cell" style={{ backgroundColor: 'transparent', border: 'none' }} />;

                return (
                  <div
                    key={dateKey}
                    className={cellClass}
                    onMouseOver={(e) => handleMouseOver(e, day)}
                    onMouseOut={handleMouseOut}
                    onClick={() => handleDayClick(day)}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
        {selectedDay && (
          <div className="selection-details-container">
              <button className="add-schedule-button" onClick={() => setIsAddModalOpen(true)}>새 일정 추가</button>
              <h3>{format(selectedDay, 'yyyy년 MM월 dd일')}</h3>
              {selectedDayInfo.holiday ? (
                  <p><strong>공휴일: {selectedDayInfo.holiday.localName}</strong></p>
              ) : ((getDay(selectedDay) === 0 || getDay(selectedDay) === 6)) ? (
                  <p><strong>휴일</strong></p>
              ) : null}
              <h4>일정 목록</h4>
              {selectedDayInfo.schedules.length > 0 ? (
                  <ul>
                      {selectedDayInfo.schedules.map((item, index) => (
                        <li key={index}>
                          <span>{item}</span>
                          <div className="schedule-actions">
                            <button onClick={() => handleEditClick(selectedDay, index, item)} title="수정">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button onClick={() => handleDeleteClick(selectedDay, index)} title="삭제" className="delete-btn">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
              ) : (
                  <p>등록된 일정이 없습니다.</p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
