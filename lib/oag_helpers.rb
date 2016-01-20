class OAGHelpers
  def self.filter_fields(obj, fields_arr)
    temp_obj = {}
    fields_arr.each {|field| temp_obj[field.to_sym] = obj[field]}
    return temp_obj
  end
end