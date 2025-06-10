import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '../../types';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  company: z.string().min(2, { message: 'Company must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(5, { message: 'Phone must be at least 5 characters' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters' }),
  nif: z.string().optional(),
  nis: z.string().optional(),
  rc: z.string().optional(),
  ai: z.string().optional(),
  rib: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  client: Client | null;
  onSuccess?: () => void;
}

const ClientForm = ({ client, onSuccess }: ClientFormProps) => {
  const { addClient, updateClient } = useApp();
  const { t } = useLanguage();

  const defaultValues: FormValues = {
    name: client?.name || '',
    company: client?.company || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    nif: client?.nif || '',
    nis: client?.nis || '',
    rc: client?.rc || '',
    ai: client?.ai || '',
    rib: client?.rib || '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: FormValues) => {
    if (client) {
      updateClient(client.id, data);
      toast.success(`${data.name} has been updated`);
    } else {
      // Ensure all required properties are passed
      const newClient: Omit<Client, 'id' | 'createdAt'> = {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        nis: data.nis,
        rc: data.rc,
        ai: data.ai,
        rib: data.rib,
      };
      addClient(newClient);
      toast.success(`${data.name} has been added`);
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('clients.form.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('clients.form.placeholders.name')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('clients.form.company')}</FormLabel>
              <FormControl>
                <Input placeholder={t('clients.form.placeholders.company')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.form.email')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('clients.form.placeholders.email')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.form.phone')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('clients.form.placeholders.phone')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('clients.form.address')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('clients.form.placeholders.address')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tax identifiers section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.form.nif')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('clients.form.placeholders.nif')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.form.nis')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('clients.form.placeholders.nis')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.form.rc')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('clients.form.placeholders.rc')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.form.ai')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('clients.form.placeholders.ai')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rib"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('clients.form.rib')}</FormLabel>
              <FormControl>
                <Input placeholder={t('clients.form.placeholders.rib')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            {t('clients.form.actions.cancel')}
          </Button>
          <Button type="submit">
            {client ? t('clients.form.actions.update') : t('clients.form.actions.add')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
