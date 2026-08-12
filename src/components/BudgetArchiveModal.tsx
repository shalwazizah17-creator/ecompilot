import { X, Calendar, FileText } from 'lucide-react'

export function BudgetArchiveModal({ onClose, data }: { onClose: () => void, data: any[] }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '12px', width: '100%', maxWidth: '800px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--surface-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--primary)" /> Arsip Target Anggaran
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Belum ada riwayat target anggaran yang disimpan.
            </div>
          ) : (
            data.map((group, idx) => {
              const monthDate = new Date(group.month)
              const approvalDate = new Date(group.created_at)
              const monthName = monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
              const approvedStr = approvalDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              
              const totalAmount = group.allocations.reduce((sum: number, a: any) => sum + a.amount, 0)
              
              return (
                <div key={idx} style={{ 
                  border: '1px solid var(--surface-border)', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, rgba(26, 86, 219, 0.08) 0%, rgba(26, 86, 219, 0.01) 100%)',
                    borderBottom: '1px solid var(--surface-border)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Periode: {monthName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> Disetujui pada: {approvedStr} WIB
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', backgroundColor: 'var(--surface)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Disetujui</div>
                      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)', marginTop: '2px' }}>
                        Rp {(totalAmount / 1000000).toFixed(1)} Juta
                      </div>
                    </div>
                  </div>
                  
                  {group.notes && (
                    <div style={{ padding: '12px 20px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--surface-border)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <FileText size={16} color="var(--primary)" style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>Catatan</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{group.notes}</div>
                      </div>
                    </div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 500 }}>Saluran</th>
                        <th style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 500 }}>Alokasi Anggaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.allocations.map((alloc: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '12px 20px', fontWeight: 500 }}>{alloc.channel}</td>
                          <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600 }}>
                            Rp {alloc.amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
