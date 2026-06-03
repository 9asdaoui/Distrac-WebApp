import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

const selectClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'

function defaultDeliveryDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function emptyLineItem() {
  return { productId: '', quantity: 1, unitPrice: '', discountPercentage: 0 }
}

function emptyInstallment(deliveryDate) {
  return {
    amount: '',
    date: deliveryDate,
    type: 'CASH',
    creditType: 'CASH',
    creditTarget: 'CLIENT',
  }
}

function lineSubtotal(item) {
  const qty = Number(item.quantity) || 0
  const price = Number(item.unitPrice) || 0
  const disc = Number(item.discountPercentage) || 0
  return qty * price * (1 - disc / 100)
}

function roundMoney(value) {
  return Math.round(value * 100) / 100
}

function productLabel(product) {
  return product?.name || product?.product_name || product?.sku || product?.id || 'Product'
}

function clientLabel(client) {
  return client?.client_name || client?.name || client?.phone || client?.id || 'Client'
}

function toDeliveryIso(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toISOString()
}

export const CreateOrderForm = forwardRef(function CreateOrderForm(_props, ref) {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [isLoadingClientData, setIsLoadingClientData] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [clientId, setClientId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate)
  const [notes, setNotes] = useState('')
  const [couponId, setCouponId] = useState('')
  const [items, setItems] = useState([emptyLineItem()])

  const [paymentMode, setPaymentMode] = useState('cash')
  const [creditType, setCreditType] = useState('CASH')
  const [creditTarget, setCreditTarget] = useState('CLIENT')
  const [splitInstallments, setSplitInstallments] = useState(() => [emptyInstallment(defaultDeliveryDate())])

  const loadCatalogProducts = useCallback(async (signal) => {
    const res = await apiInstance.get('/products', {
      params: { limit: 100, sortBy: 'name', isActive: true },
      signal,
    })
    return res.data?.data?.products || []
  }, [])

  const loadClients = useCallback(async (signal) => {
    const res = await apiInstance.get('/clients', {
      params: { limit: 100, sortBy: 'name', isActive: true },
      signal,
    })
    return res.data?.data?.clients || []
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingMeta(true)
    setLoadError('')

    Promise.all([loadClients(controller.signal), loadCatalogProducts(controller.signal)])
      .then(([clientList, productList]) => {
        if (controller.signal.aborted) return
        setClients(clientList)
        setProducts(productList)
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setClients([])
          setProducts([])
          setLoadError(err?.response?.data?.message || 'Failed to load clients and products.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingMeta(false)
      })

    return () => controller.abort()
  }, [loadClients, loadCatalogProducts])

  useEffect(() => {
    if (!clientId) {
      setCoupons([])
      setCouponId('')
      return undefined
    }

    const controller = new AbortController()
    setIsLoadingClientData(true)
    setLoadError('')

    Promise.all([
      apiInstance.get('/products', {
        params: { clientId, limit: 100, isActive: true },
        signal: controller.signal,
      }),
      apiInstance.get(`/clients/${clientId}/coupons`, { signal: controller.signal }),
    ])
      .then(async ([productsRes, couponsRes]) => {
        if (controller.signal.aborted) return

        let productList = productsRes.data?.data?.products || []
        if (productList.length === 0) {
          productList = await loadCatalogProducts(controller.signal)
        }

        setProducts(productList)
        setCoupons(couponsRes.data?.data?.coupons || [])
        setCouponId('')
        setItems([emptyLineItem()])
      })
      .catch(async (err) => {
        if (controller.signal.aborted) return
        setCoupons([])
        setCouponId('')
        try {
          const fallback = await loadCatalogProducts(controller.signal)
          if (!controller.signal.aborted) setProducts(fallback)
        } catch {
          setProducts([])
        }
        setLoadError(err?.response?.data?.message || 'Failed to load client products or coupons.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingClientData(false)
      })

    return () => controller.abort()
  }, [clientId, loadCatalogProducts])

  const orderSubtotal = useMemo(
    () => roundMoney(items.reduce((sum, item) => sum + lineSubtotal(item), 0)),
    [items],
  )

  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => coupon.id === couponId) || null,
    [coupons, couponId],
  )

  const couponAmount = selectedCoupon ? Number(selectedCoupon.amount) || 0 : 0
  const payableTotal = roundMoney(Math.max(0, orderSubtotal - couponAmount))

  const buildInstallments = () => {
    const deliveryIso = toDeliveryIso(deliveryDate)

    if (paymentMode === 'cash') {
      return [{ amount: payableTotal, date: deliveryIso, type: 'CASH' }]
    }

    if (paymentMode === 'credit') {
      const row = {
        amount: payableTotal,
        date: deliveryIso,
        type: 'CREDIT',
        credit_type: creditType,
      }
      if (creditType === 'CHECK') {
        row.credit_target = creditTarget
      }
      return [row]
    }

    return splitInstallments
      .filter((row) => row.amount !== '' && Number(row.amount) > 0)
      .map((row) => {
        const installment = {
          amount: roundMoney(Number(row.amount)),
          date: toDeliveryIso(row.date || deliveryDate),
          type: row.type,
        }
        if (row.type === 'CREDIT') {
          installment.credit_type = row.creditType || 'CASH'
          if (installment.credit_type === 'CHECK') {
            installment.credit_target = row.creditTarget || 'CLIENT'
          }
        }
        return installment
      })
  }

  const installmentTotal = useMemo(() => {
    try {
      return roundMoney(buildInstallments().reduce((sum, row) => sum + Number(row.amount || 0), 0))
    } catch {
      return 0
    }
  }, [paymentMode, creditType, creditTarget, splitInstallments, payableTotal, deliveryDate])

  const buildPayload = () => {
    const parsedItems = items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPercentage: Number(item.discountPercentage) || 0,
      }))

    if (!clientId) throw new Error('Please select a client.')
    if (!deliveryDate) throw new Error('Delivery date is required.')
    if (parsedItems.length === 0) throw new Error('Add at least one product line.')
    if (parsedItems.some((item) => !item.quantity || item.quantity < 1)) {
      throw new Error('Each line must have a quantity of at least 1.')
    }
    if (parsedItems.some((item) => Number.isNaN(item.unitPrice) || item.unitPrice < 0)) {
      throw new Error('Each line must have a valid unit price.')
    }
    if (orderSubtotal <= 0) throw new Error('Order total must be greater than zero.')

    const installments = buildInstallments()
    if (installments.length === 0) {
      throw new Error('Add at least one payment installment.')
    }

    const installmentSum = roundMoney(installments.reduce((sum, row) => sum + row.amount, 0))
    if (Math.abs(installmentSum - payableTotal) > 0.01) {
      throw new Error(
        `Payment installments (${installmentSum.toLocaleString()} DA) must equal the payable total (${payableTotal.toLocaleString()} DA).`,
      )
    }

    const deliveryIso = toDeliveryIso(deliveryDate)

    return {
      clientId,
      deliveryDate: deliveryIso,
      notes: notes.trim() || undefined,
      couponId: couponId || undefined,
      discountAmount: 0,
      items: parsedItems,
      installments,
    }
  }

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const payload = buildPayload()
      const res = await apiInstance.post('/orders', payload)
      return res.data?.data?.order || res.data?.data
    },
    reset: () => {
      setClientId('')
      setDeliveryDate(defaultDeliveryDate())
      setNotes('')
      setCouponId('')
      setItems([emptyLineItem()])
      setCoupons([])
      setPaymentMode('cash')
      setCreditType('CASH')
      setCreditTarget('CLIENT')
      setSplitInstallments([emptyInstallment(defaultDeliveryDate())])
      setLoadError('')
    },
  }))

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => p.id === productId)
    updateItem(index, {
      productId,
      unitPrice: product?.base_price != null ? String(product.base_price) : '',
    })
  }

  const addLine = () => setItems((prev) => [...prev, emptyLineItem()])

  const removeLine = (index) => {
    setItems((prev) => (prev.length <= 1 ? [emptyLineItem()] : prev.filter((_, i) => i !== index)))
  }

  const addSplitRow = () => {
    setSplitInstallments((prev) => [...prev, emptyInstallment(deliveryDate)])
  }

  const updateSplitRow = (index, patch) => {
    setSplitInstallments((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const removeSplitRow = (index) => {
    setSplitInstallments((prev) =>
      prev.length <= 1 ? [emptyInstallment(deliveryDate)] : prev.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="space-y-6">
      {isLoadingMeta ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading clients and products…</p>
      ) : null}

      {loadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {loadError}
        </p>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Client <span className="text-red-500">*</span>
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={selectClass}
            disabled={isLoadingMeta}
          >
            <option value="">
              {clients.length === 0 && !isLoadingMeta ? 'No clients available' : 'Select client'}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {clientLabel(client)}
                {client.city ? ` — ${client.city}` : ''}
              </option>
            ))}
          </select>
        </div>

        {clientId && isLoadingClientData ? (
          <p className="text-xs text-zinc-500">Loading products and coupons for this client…</p>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Delivery date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional order notes"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Return coupon
          </label>
          <select
            value={couponId}
            onChange={(e) => setCouponId(e.target.value)}
            className={selectClass}
            disabled={!clientId || isLoadingClientData}
          >
            <option value="">
              {!clientId
                ? 'Select a client first'
                : coupons.length === 0
                  ? 'No unused coupons for this client'
                  : 'No coupon'}
            </option>
            {coupons.map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {Number(coupon.amount).toLocaleString()} DA
                {coupon.created_at ? ` — ${new Date(coupon.created_at).toLocaleDateString()}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Line items</h3>
          <button
            type="button"
            onClick={addLine}
            disabled={!clientId || products.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line
          </button>
        </div>

        {!clientId ? (
          <p className="text-sm text-zinc-500">Select a client to add products.</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-zinc-500">No products available for this client.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`line-${index}`}
                className="rounded-xl border border-gray-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Line {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-800"
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-zinc-500">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {productLabel(product)}
                          {product.base_price != null
                            ? ` — ${Number(product.base_price).toLocaleString()} DA`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Unit price (DA)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Discount %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={item.discountPercentage}
                      onChange={(e) => updateItem(index, { discountPercentage: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-end sm:col-span-2">
                    <p className="text-xs text-zinc-500">
                      Subtotal:{' '}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {lineSubtotal(item).toLocaleString(undefined, { maximumFractionDigits: 2 })} DA
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Subtotal</span>
            <span>{orderSubtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} DA</span>
          </div>
          {couponAmount > 0 ? (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Coupon</span>
              <span>−{couponAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} DA</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
            <span>Payable total</span>
            <span>{payableTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} DA</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment</h3>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'cash', label: 'Full cash' },
            { id: 'credit', label: 'Full credit' },
            { id: 'split', label: 'Split plan' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPaymentMode(opt.id)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                paymentMode === opt.id
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-gray-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {paymentMode === 'credit' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Credit type</label>
              <select
                value={creditType}
                onChange={(e) => setCreditType(e.target.value)}
                className={selectClass}
              >
                <option value="CASH">Cash credit</option>
                <option value="CHECK">Check</option>
              </select>
            </div>
            {creditType === 'CHECK' ? (
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Check payable to</label>
                <select
                  value={creditTarget}
                  onChange={(e) => setCreditTarget(e.target.value)}
                  className={selectClass}
                >
                  <option value="CLIENT">Client</option>
                  <option value="BANK">Bank</option>
                </select>
              </div>
            ) : null}
          </div>
        ) : null}

        {paymentMode === 'split' ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addSplitRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Add installment
              </button>
            </div>
            {splitInstallments.map((row, index) => (
              <div
                key={`inst-${index}`}
                className="rounded-xl border border-gray-200 p-3 dark:border-zinc-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Installment {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSplitRow(index)}
                    className="text-zinc-400 hover:text-red-600"
                    aria-label="Remove installment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Amount (DA)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateSplitRow(index, { amount: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Due date</label>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateSplitRow(index, { date: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Type</label>
                    <select
                      value={row.type}
                      onChange={(e) => updateSplitRow(index, { type: e.target.value })}
                      className={selectClass}
                    >
                      <option value="CASH">Cash</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                  {row.type === 'CREDIT' ? (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-500">Credit type</label>
                        <select
                          value={row.creditType}
                          onChange={(e) => updateSplitRow(index, { creditType: e.target.value })}
                          className={selectClass}
                        >
                          <option value="CASH">Cash credit</option>
                          <option value="CHECK">Check</option>
                        </select>
                      </div>
                      {row.creditType === 'CHECK' ? (
                        <div>
                          <label className="mb-1 block text-xs text-zinc-500">Check payable to</label>
                          <select
                            value={row.creditTarget}
                            onChange={(e) => updateSplitRow(index, { creditTarget: e.target.value })}
                            className={selectClass}
                          >
                            <option value="CLIENT">Client</option>
                            <option value="BANK">Bank</option>
                          </select>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <p
          className={`text-xs ${
            Math.abs(installmentTotal - payableTotal) > 0.01 && payableTotal > 0
              ? 'text-red-500'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          Installments total: {installmentTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} DA
          {payableTotal > 0 ? ` / ${payableTotal.toLocaleString()} DA required` : ''}
        </p>
      </div>
    </div>
  )
})
