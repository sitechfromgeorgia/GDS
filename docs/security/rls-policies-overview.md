### 🔒 Security
- **Role-based access control** (admin, restaurant, driver, demo)
- **Data isolation** between roles
- **Business logic enforcement** at database level
- **Audit logging** for policy violations

### 🎯 Business Logic
- **Order workflow validation** with status progression rules
- **Inventory management** with stock level enforcement
- **Driver assignment** with capacity validation
- **Demo session limitations** for testing purposes

### 📊 Monitoring
- **Policy violation logging** in `policy_audit_log` table
- **Performance tracking** for policy execution
- **Access pattern analysis** for security insights

## Quick Start

1. **Apply the migration:**
   ```bash
   supabase db push
   ```

2. **Test policies:**
   ```bash
   # Run policy validation
   supabase functions deploy admin-validate-rls
   ```

3. **Monitor policy violations:**
   ```sql
   SELECT * FROM policy_audit_log WHERE allowed = false;
   ```

## Policy Hierarchy

```
Admin (Full Access)
├── Restaurant (Business Operations)
│   ├── Driver (Order Fulfillment)
│   └── Demo (Limited Testing)
└── System Functions
```

## Common Use Cases

### Restaurant Operations
- Create and manage orders
- Update order status
- Manage product inventory
- View order history

### Driver Operations
- View assigned orders
- Update delivery status
- Accept pending orders
- Track delivery progress

### Admin Operations
- Full system access
- User management
- Policy oversight
- System monitoring

### Demo Operations
- Limited read-only access
- Time-restricted sessions
- Data isolation
- Testing safeguards

## Policy Validation

All policies are validated through:

1. **Automated testing** with role-specific test cases
2. **Manual verification** of business logic
3. **Audit log monitoring** for violations
4. **Performance optimization** reviews

## Support

For questions or issues:
1. Check the `testing/` directory for common solutions
2. Review the specific role or table documentation
3. Examine the audit logs for violation patterns
4. Contact the system administrator

---

**Last Updated:** November 4, 2025  
**Version:** 1.0  
**System:** Georgian Distribution System