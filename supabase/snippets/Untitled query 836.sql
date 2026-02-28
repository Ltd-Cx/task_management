  -- バケットを公開に設定                                                                                                                                                               
  UPDATE storage.buckets                                                                                                                                                                
  SET public = true                                                                                                                                                                     
  WHERE id = 'user';                                                                                                                                                                    
                                                                                                                                                                                        
  -- 誰でも読み取り可能                                                                                                                                                                 
  CREATE POLICY "Allow public read access"                                                                                                                                              
  ON storage.objects FOR SELECT                                                                                                                                                         
  USING (bucket_id = 'user');                                                                                                                                                           
                                                                                                                                                                                        
  -- 誰でもアップロード可能（ローカル開発用）                                                                                                                                           
  CREATE POLICY "Allow public uploads"                                                                                                                                                  
  ON storage.objects FOR INSERT                                                                                                                                                         
  WITH CHECK (bucket_id = 'user');                                                                                                                                                      
                                                                                                                                                                                        
  -- 誰でも更新可能（ローカル開発用）                                                                                                                                                   
  CREATE POLICY "Allow public updates"                                                                                                                                                  
  ON storage.objects FOR UPDATE                                                                                                                                                         
  USING (bucket_id = 'user');                                                                                                                                                           
                                                                                                                                                                                        
  -- 誰でも削除可能（ローカル開発用）                                                                                                                                                   
  CREATE POLICY "Allow public deletes"                                                                                                                                                  
  ON storage.objects FOR DELETE                                                                                                                                                         
  USING (bucket_id = 'user'); 