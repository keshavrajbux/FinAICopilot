/**
 * Tenant Manager
 *
 * Core service for managing tenant configuration, authentication, and isolation
 */

import { createClient } from '@supabase/supabase-js';
import { TenantConfig, TenantAPIKey, TenantUser } from './types';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export class TenantManager {
  /**
   * Get tenant configuration by ID
   */
  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }

      return this.mapToTenantConfig(data);
    } catch (error) {
      console.error('Exception in getTenant:', error);
      return null;
    }
  }

  /**
   * Get tenant by organization name
   */
  async getTenantByOrganization(orgName: string): Promise<TenantConfig | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('organization_name', orgName)
        .single();

      if (error) {
        console.error('Error fetching tenant by org:', error);
        return null;
      }

      return this.mapToTenantConfig(data);
    } catch (error) {
      console.error('Exception in getTenantByOrganization:', error);
      return null;
    }
  }

  /**
   * Authenticate tenant using API key
   */
  async authenticateTenant(apiKey: string): Promise<TenantConfig | null> {
    try {
      // Hash the provided API key
      const keyHash = this.hashApiKey(apiKey);

      // Look up the API key
      const { data: keyData, error: keyError } = await supabase
        .from('tenant_api_keys')
        .select('*, tenants(*)')
        .eq('key_hash', keyHash)
        .eq('status', 'active')
        .single();

      if (keyError || !keyData) {
        console.error('Invalid or inactive API key');
        return null;
      }

      // Check if key is expired
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        console.error('API key has expired');
        return null;
      }

      // Update last used timestamp
      await supabase
        .from('tenant_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyData.id);

      // Check if tenant is active
      const tenant = keyData.tenants;
      if (tenant.status !== 'active' && tenant.status !== 'trial') {
        console.error('Tenant is not active');
        return null;
      }

      return this.mapToTenantConfig(tenant);
    } catch (error) {
      console.error('Exception in authenticateTenant:', error);
      return null;
    }
  }

  /**
   * Create a new tenant
   */
  async createTenant(params: {
    organizationName: string;
    displayName: string;
    tier: 'starter' | 'growth' | 'enterprise';
    createdBy: string;
    billingEmail: string;
  }): Promise<TenantConfig | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([
          {
            organization_name: params.organizationName,
            display_name: params.displayName,
            status: 'trial',
            tier: params.tier,
            created_by: params.createdBy,
            billing: {
              billingEmail: params.billingEmail,
              usageBasedBilling: false
            }
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating tenant:', error);
        return null;
      }

      return this.mapToTenantConfig(data);
    } catch (error) {
      console.error('Exception in createTenant:', error);
      return null;
    }
  }

  /**
   * Update tenant configuration
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<TenantConfig>
  ): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.displayName) updateData.display_name = updates.displayName;
      if (updates.status) updateData.status = updates.status;
      if (updates.tier) updateData.tier = updates.tier;
      if (updates.branding) updateData.branding = updates.branding;
      if (updates.features) updateData.features = updates.features;
      if (updates.limits) updateData.limits = updates.limits;
      if (updates.compliance) updateData.compliance = updates.compliance;

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId);

      if (error) {
        console.error('Error updating tenant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in updateTenant:', error);
      return false;
    }
  }

  /**
   * Generate new API key for tenant
   */
  async generateApiKey(params: {
    tenantId: string;
    name: string;
    permissions?: ('read' | 'write' | 'admin')[];
    expiresInDays?: number;
    createdBy: string;
  }): Promise<{ apiKey: string; keyId: string } | null> {
    try {
      // Generate a secure random API key
      const apiKey = this.generateSecureKey('sk_live');
      const keyHash = this.hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 15); // "sk_live_" + first 7 chars

      // Calculate expiration if provided
      const expiresAt = params.expiresInDays
        ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('tenant_api_keys')
        .insert([
          {
            tenant_id: params.tenantId,
            name: params.name,
            key_prefix: keyPrefix,
            key_hash: keyHash,
            permissions: params.permissions || ['read', 'write'],
            expires_at: expiresAt,
            created_by: params.createdBy
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error generating API key:', error);
        return null;
      }

      // Return the plain API key (only shown once)
      return {
        apiKey,
        keyId: data.id
      };
    } catch (error) {
      console.error('Exception in generateApiKey:', error);
      return null;
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string, tenantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tenant_api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error revoking API key:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in revokeApiKey:', error);
      return false;
    }
  }

  /**
   * List all API keys for a tenant
   */
  async listApiKeys(tenantId: string): Promise<TenantAPIKey[]> {
    try {
      const { data, error } = await supabase
        .from('tenant_api_keys')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error listing API keys:', error);
        return [];
      }

      return data.map(this.mapToTenantAPIKey);
    } catch (error) {
      console.error('Exception in listApiKeys:', error);
      return [];
    }
  }

  /**
   * Register or update a tenant user
   */
  async registerUser(
    tenantId: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tenant_users')
        .upsert(
          {
            tenant_id: tenantId,
            user_id: userId,
            metadata: metadata || {},
            last_active_at: new Date().toISOString()
          },
          { onConflict: 'tenant_id,user_id' }
        );

      if (error) {
        console.error('Error registering user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in registerUser:', error);
      return false;
    }
  }

  /**
   * Set tenant context for RLS
   */
  async setTenantContext(tenantId: string): Promise<void> {
    try {
      await supabase.rpc('set_tenant_context', { tenant_uuid: tenantId });
    } catch (error) {
      console.error('Error setting tenant context:', error);
    }
  }

  /**
   * Check if tenant has access to a feature
   */
  hasFeature(tenant: TenantConfig, feature: string): boolean {
    return tenant.features[feature as keyof typeof tenant.features] === true;
  }

  /**
   * Check if tenant is within rate limits
   */
  async checkRateLimit(
    tenantId: string,
    limitType: 'perMinute' | 'perDay'
  ): Promise<boolean> {
    // This will be implemented with Redis in the rate-limit service
    // For now, return true
    return true;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapToTenantConfig(data: any): TenantConfig {
    return {
      id: data.id,
      organizationName: data.organization_name,
      displayName: data.display_name,
      status: data.status,
      tier: data.tier,
      branding: data.branding,
      apiConfig: data.api_config,
      features: data.features,
      limits: data.limits,
      compliance: data.compliance,
      dataConfig: data.data_config,
      billing: data.billing,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    };
  }

  private mapToTenantAPIKey(data: any): TenantAPIKey {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      keyPrefix: data.key_prefix,
      keyHash: data.key_hash,
      permissions: data.permissions,
      status: data.status,
      expiresAt: data.expires_at,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
      createdBy: data.created_by
    };
  }

  private generateSecureKey(prefix: string): string {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64url');
    return `${prefix}_${key}`;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}

// Export singleton instance
export const tenantManager = new TenantManager();
